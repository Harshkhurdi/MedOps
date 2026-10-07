import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "../db";
import { AppError } from "../errors";
import { can, digest } from "../auth";
import { trackerImport, type TrackerTender } from "./tender-tracker-contract";
import type { Prisma } from "@/generated/prisma/client";
export const integrationPrefix = "/api/integrations/tender-tracker";
export function integrationConfig() {
  const secret = process.env.TENDER_TRACKER_INTEGRATION_SECRET;
  const tracker = process.env.TENDER_TRACKER_URL;
  const app = process.env.APP_URL;
  const environment = process.env.INTEGRATION_ENVIRONMENT;
  if (
    !secret ||
    secret.length < 32 ||
    !tracker ||
    !app ||
    !["production", "development", "preview"].includes(environment ?? "")
  )
    throw new AppError(503, "Tender Tracker integration is not configured");
  for (const value of [tracker, app]) {
    const u = new URL(value);
    if (
      u.username ||
      u.password ||
      u.pathname !== "/" ||
      u.search ||
      u.hash ||
      (environment === "production" && u.protocol !== "https:") ||
      (environment !== "production" &&
        !["localhost", "127.0.0.1"].includes(u.hostname) &&
        environment === "development")
    )
      throw new AppError(503, "Integration environment is not valid");
  }
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== environment)
    throw new AppError(
      503,
      "Integration environment does not match this deployment",
    );
  return {
    secret,
    tracker: new URL(tracker).origin,
    app: new URL(app).origin,
    environment: environment!,
  };
}
export function verifySignature(req: Request, body: string) {
  const c = integrationConfig();
  const ts = req.headers.get("x-medops-timestamp") ?? "",
    signature = req.headers.get("x-medops-signature") ?? "",
    env = req.headers.get("x-medops-environment");
  if (
    !/^\d{13}$/.test(ts) ||
    Math.abs(Date.now() - Number(ts)) > 60000 ||
    env !== c.environment ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    throw new AppError(401, "Integration authorization failed");
  const expected = createHmac("sha256", c.secret)
    .update(`${ts}\n${env}\nPOST\n${new URL(req.url).pathname}\n${body}`)
    .digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex")))
    throw new AppError(401, "Integration authorization failed");
}
export async function limitedBody(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new AppError(415, "Use application/json");
  const reader = req.body?.getReader();
  if (!reader) throw new AppError(400, "Request body is missing");
  const parts: Uint8Array[] = [];
  let n = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > 128000) {
      await reader.cancel();
      throw new AppError(413, "Request is too large");
    }
    parts.push(value);
  }
  return Buffer.concat(parts).toString("utf8");
}
export function parsed(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    throw new AppError(400, "Invalid JSON");
  }
}
export async function rateLimit(key: string, limit = 60) {
  const window = new Date(Math.floor(Date.now() / 60000) * 60000);
  const rows = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "TenderTrackerRate" ("key","window","count") VALUES (${key},${window},1) ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "TenderTrackerRate"."window"=${window} THEN "TenderTrackerRate"."count"+1 ELSE 1 END,"window"=${window} RETURNING "count"`;
  if (rows[0].count > limit)
    throw new AppError(
      429,
      "Too many integration requests. Try again shortly.",
    );
}
export async function grantActor(token: string) {
  const grant = await db.tenderTrackerGrant.findUnique({
    where: { tokenHash: digest(token) },
  });
  if (!grant || grant.expiresAt <= new Date())
    throw new AppError(401, "Reconnect your MedOps account");
  const session = await db.session.findUnique({
    where: { id: grant.sessionId },
    include: { user: { include: { permissions: true } } },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.active)
    throw new AppError(401, "Reconnect your MedOps account");
  if (!can(session.user, "tenders", true))
    throw new AppError(403, "Tender write permission is required");
  return session.user;
}
export async function issueCode(sessionId: string) {
  await db.tenderTrackerGrant.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  const code = randomBytes(32).toString("base64url");
  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt <= new Date())
    throw new AppError(401, "Please sign in");
  await db.tenderTrackerGrant.create({
    data: { codeHash: digest(code), sessionId, expiresAt: session.expiresAt },
  });
  return code;
}
export async function exchangeCode(code: string) {
  const row = await db.tenderTrackerGrant.findUnique({
    where: { codeHash: digest(code) },
  });
  if (
    !row ||
    row.codeConsumed ||
    Date.now() - row.createdAt.getTime() > 60000 ||
    row.expiresAt <= new Date()
  )
    throw new AppError(401, "Connection code expired. Connect again.");
  const session = await db.session.findUnique({
    where: { id: row.sessionId },
    include: { user: { include: { permissions: true } } },
  });
  if (
    !session ||
    session.expiresAt <= new Date() ||
    !session.user.active ||
    !can(session.user, "tenders", true)
  )
    throw new AppError(403, "Tender write permission is required");
  const token = randomBytes(32).toString("base64url");
  const claimed = await db.tenderTrackerGrant.updateMany({
    where: { id: row.id, codeConsumed: false },
    data: { codeConsumed: true, tokenHash: digest(token) },
  });
  if (claimed.count !== 1)
    throw new AppError(401, "Connection code has already been used");
  await db.auditLog.create({
    data: {
      userId: session.userId,
      action: "TRACKER_CONNECTED",
      module: "tenders",
    },
  });
  return { grant: token, expiresAt: row.expiresAt.toISOString() };
}
// Observation timestamps change on every fetch; business/source revisions determine a new version.
export function sourceFingerprint(t: TrackerTender) {
  const { discoveredAt, sourceUpdatedAt, ...content } = t;
  void discoveredAt;
  void sourceUpdatedAt;
  return digest(JSON.stringify(content));
}
export async function importTender(input: unknown) {
  const payload = trackerImport.parse(input),
    actor = await grantActor(payload.grant);
  await rateLimit("import:" + actor.id);
  const t = payload.tender,
    fingerprint = sourceFingerprint(t);
  const number =
    t.number ??
    t.bidNumber ??
    `TRACKER-${digest(t.externalTenderId).slice(0, 24)}`;
  // A transaction-scoped advisory lock serializes repeats AND canonical-number collisions.
  const result = await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('tender-tracker-import',0))`;
      let link = await tx.externalTenderImport.findUnique({
        where: {
          externalSource_externalTenderId: {
            externalSource: "TENDER_TRACKER",
            externalTenderId: t.externalTenderId,
          },
        },
      });
      let created = false;
      if (!link) {
        const candidates = await tx.tender.findMany({
          where: {
            OR: [
              { number },
              ...(t.bidNumber ? [{ bidNumber: t.bidNumber }] : []),
              ...(!t.number && !t.bidNumber
                ? [
                    {
                      sourceUrl: t.sourceUrl,
                      title: t.title,
                      ...(t.institution
                        ? { institutionName: t.institution }
                        : {}),
                      ...(t.publicationDate
                        ? { publicationDate: new Date(t.publicationDate) }
                        : {}),
                    },
                  ]
                : []),
            ],
          },
          select: { id: true },
          take: 2,
        });
        if (candidates.length > 1)
          throw new AppError(
            409,
            "Multiple MedOps records match this source. An administrator must review the duplicate records.",
          );
        let tenderId = candidates[0]?.id;
        if (!tenderId) {
          const tender = await tx.tender.create({
            data: {
              number,
              bidNumber: t.bidNumber,
              title: t.title,
              institutionName: t.institution,
              state: t.state,
              category: t.category,
              source: t.sourceName,
              sourceUrl: t.sourceUrl,
              publicationDate: t.publicationDate
                ? new Date(t.publicationDate)
                : undefined,
              deadline: t.deadline ? new Date(t.deadline) : undefined,
              estimatedValue: t.estimatedValue,
              notes: t.description,
              recordSource: "TENDER_TRACKER",
              status: "UNDER_REVIEW",
              items: {
                create: t.items
                  .filter(
                    (i) =>
                      payload.selectedItemIds.includes(i.id) &&
                      i.quantity !== null,
                  )
                  .map((i) => ({
                    equipment: i.equipment,
                    quantity: i.quantity!,
                    category: i.category,
                    sourceItemId: i.id,
                    sourceUrl: i.sourceUrl,
                  })),
              },
              decisions: {
                create: {
                  decision: "PENDING_REVIEW",
                  decisionBy: actor.id,
                  reason:
                    "Discovered in Tender Tracker; employee review required",
                },
              },
            },
          });
          tenderId = tender.id;
          created = true;
        }
        link = await tx.externalTenderImport.create({
          data: {
            externalTenderId: t.externalTenderId,
            externalSourceUrl: t.sourceUrl,
            tenderId,
            sourceUpdatedAt: t.sourceUpdatedAt
              ? new Date(t.sourceUpdatedAt)
              : null,
          },
        });
      }
      const previous = await tx.tenderSourceVersion.findUnique({
        where: { importId_fingerprint: { importId: link.id, fingerprint } },
      });
      let status = created ? "ADDED" : "EXISTING";
      if (!previous) {
        await tx.tenderSourceVersion.create({
          data: {
            importId: link.id,
            fingerprint,
            snapshot: t as unknown as Prisma.InputJsonValue,
            discoveredAt: new Date(t.discoveredAt),
            sourceUpdatedAt: t.sourceUpdatedAt
              ? new Date(t.sourceUpdatedAt)
              : null,
          },
        });
        await tx.externalTenderImport.update({
          where: { id: link.id },
          data: {
            sourceUpdatedAt: t.sourceUpdatedAt
              ? new Date(t.sourceUpdatedAt)
              : null,
          },
        });
        if (!created) status = "SOURCE_UPDATE_AVAILABLE";
      } else if (previous.resolution === "PENDING_REVIEW" && !created) {
        const earlier = await tx.tenderSourceVersion.count({
          where: { importId: link.id, receivedAt: { lt: previous.receivedAt } },
        });
        status = earlier > 0 ? "SOURCE_UPDATE_AVAILABLE" : "EXISTING";
      }
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action:
            status === "ADDED"
              ? "TRACKER_IMPORT"
              : status === "SOURCE_UPDATE_AVAILABLE"
                ? "TRACKER_SOURCE_UPDATE"
                : "TRACKER_REPEAT_IMPORT",
          module: "tenders",
          recordId: link.tenderId,
          details: { externalTenderId: t.externalTenderId, importId: link.id },
        },
      });
      await tx.tenderTrackerHealth.upsert({
        where: { id: "main" },
        create: { lastSuccessAt: new Date() },
        update: { lastSuccessAt: new Date() },
      });
      return {
        tenderId: link.tenderId,
        status,
        importedAt: link.importedAt.toISOString(),
        url: `${integrationConfig().app}/tenders?record=${encodeURIComponent(link.tenderId)}`,
      };
    },
    { timeout: 15000 },
  );
  return result;
}
export async function integrationHealth() {
  let configured = false,
    environment = "Not configured";
  try {
    environment = integrationConfig().environment;
    configured = true;
  } catch {}
  const row = await db.tenderTrackerHealth.findUnique({
    where: { id: "main" },
  });
  return {
    configured,
    environment,
    lastSuccessAt: row?.lastSuccessAt ?? null,
    lastFailureAt: row?.lastFailureAt ?? null,
    failureReason: row?.failureReason ?? null,
  };
}
export async function recordFailure(status: number) {
  // Deliberately never store request text, URLs, tokens, raw errors or authorization headers.
  const reasons: Record<number, string> = {
    400: "Invalid discovery data",
    401: "Integration or employee authorization failed",
    403: "Employee authorization failed",
    409: "Duplicate records require review",
    413: "Payload too large",
    415: "Unsupported content type",
    429: "Import rate limit reached",
    503: "Integration configuration unavailable",
  };
  await db.auditLog.create({
    data: {
      action: "TRACKER_IMPORT_FAILED",
      module: "tenders",
      details: { status },
    },
  });
  await db.tenderTrackerHealth.upsert({
    where: { id: "main" },
    create: {
      lastFailureAt: new Date(),
      failureReason: reasons[status] ?? "Import service unavailable",
    },
    update: {
      lastFailureAt: new Date(),
      failureReason: reasons[status] ?? "Import service unavailable",
    },
  });
}
