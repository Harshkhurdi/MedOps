import { createHmac, createHash } from "node:crypto";
import { beforeAll, afterAll, it, expect } from "vitest";
import { db } from "@/lib/db";
import { hashPassword, type Actor } from "@/lib/auth";
import {
  importTender,
  issueCode,
  exchangeCode,
  grantActor,
  rateLimit,
  recordFailure,
  integrationHealth,
} from "@/lib/integrations/tender-tracker";
import { reviewSource } from "@/lib/integrations/tender-source-review";
import { save } from "@/lib/service";
let actor: Actor, grant: string, sessionId: string;
const source = {
  externalTenderId: "SYNTHETIC-TRACKER-001",
  number: "SYNTHETIC-IMPORT-001",
  sourceUrl: "https://hospital.example/tender/1",
  sourceName: "Official public source",
  title: "Two medical items",
  institution: "Synthetic hospital",
  discoveredAt: "2026-10-07T10:00:00Z",
  deadline: "2026-10-25T12:00:00Z",
  items: [
    {
      id: "line1",
      equipment: "Device one",
      quantity: 2,
      category: "Monitoring",
      sourceUrl: "https://hospital.example/boq",
    },
    { id: "line2", equipment: "Device two", quantity: 3 },
    { id: "line3", equipment: "Unknown quantity device", quantity: null },
  ],
  documents: [
    { label: "Tender PDF", url: "https://hospital.example/tender.pdf" },
  ],
  revisions: [],
  references: [],
};
const input = (tender: unknown = source) => ({
  grant,
  tender,
  selectedItemIds: ["line1", "line3"],
});
beforeAll(async () => {
  process.env.TENDER_TRACKER_INTEGRATION_SECRET = "x".repeat(48);
  process.env.TENDER_TRACKER_URL = "http://localhost:3001";
  process.env.INTEGRATION_ENVIRONMENT = "development";
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "User", "Tender", "TenderTrackerGrant", "TenderTrackerRate", "TenderTrackerHealth" CASCADE',
  );
  actor = await db.user.create({
    data: {
      email: "tracker@example.test",
      name: "Synthetic integration administrator",
      passwordHash: hashPassword("synthetic-private-password"),
      role: "ADMIN",
    },
    include: { permissions: true },
  });
  const session = await db.session.create({
    data: {
      userId: actor.id,
      tokenHash: "synthetic-session",
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  sessionId = session.id;
  grant = (await exchangeCode(await issueCode(sessionId))).grant;
});
afterAll(() => db.$disconnect());
it("imports only selected known quantities, pending review, with immutable source history and no commercial actions", async () => {
  const result = await importTender(input());
  const tender = await db.tender.findUniqueOrThrow({
    where: { id: result.tenderId },
    include: {
      items: true,
      decisions: true,
      rfqs: true,
      orders: true,
      requirements: true,
    },
  });
  expect(result.status).toBe("ADDED");
  expect(tender.items).toHaveLength(1);
  expect(tender.items[0]).toMatchObject({
    equipment: "Device one",
    quantity: 2,
    manufacturerId: null,
    productId: null,
    model: null,
    category: "Monitoring",
    sourceItemId: "line1",
  });
  expect(tender.institutionName).toBe(source.institution);
  expect(tender.status).toBe("UNDER_REVIEW");
  expect(tender.decisions[0].decision).toBe("PENDING_REVIEW");
  expect(tender.rfqs).toHaveLength(0);
  expect(tender.orders).toHaveLength(0);
  expect(tender.requirements).toHaveLength(0);
  expect(await db.storedFile.count()).toBe(0);
  const version = await db.tenderSourceVersion.findFirstOrThrow();
  expect(version.snapshot).toMatchObject({
    items: source.items,
    documents: source.documents,
  });
});

it("makes concurrent double clicks and retries idempotent", async () => {
  const results = await Promise.all(
    Array.from({ length: 4 }, () => importTender(input())),
  );
  expect(new Set(results.map((r) => r.tenderId)).size).toBe(1);
  expect(results.every((r) => r.status === "EXISTING")).toBe(true);
  expect(await db.tender.count()).toBe(1);
  expect(await db.externalTenderImport.count()).toBe(1);
  expect(await db.tenderSourceVersion.count()).toBe(1);
});
it("deduplicates alternate external identities by canonical number without changing the existing tender", async () => {
  const result = await importTender(
    input({ ...source, externalTenderId: "alias-source-identity" }),
  );
  expect(result.status).toBe("SOURCE_UPDATE_AVAILABLE");
  expect(await db.tender.count()).toBe(1);
  expect(await db.externalTenderImport.count()).toBe(2);
});
it("preserves manual edits when a corrigendum arrives; applies only reviewed values and selected items", async () => {
  const result = await importTender(input());
  const old = await db.tender.findUniqueOrThrow({
    where: { id: result.tenderId },
  });
  await save(
    "tenders",
    {
      number: old.number,
      title: "Employee edited title",
      institutionName: "Employee institution",
      recordSource: "TENDER_TRACKER",
      status: "UNDER_REVIEW",
      items: [{ equipment: "Device one", quantity: 9, sourceItemId: "line1" }],
    },
    actor,
    old.id,
    old.updatedAt.toISOString(),
  );
  const revised = {
    ...source,
    title: "Revised source title",
    deadline: "2026-11-01T12:00:00Z",
    items: [
      { ...source.items[0], quantity: 4 },
      source.items[1],
      source.items[2],
    ],
    revisions: [
      {
        title: "Deadline and quantity corrigendum",
        url: "https://hospital.example/revision.pdf",
      },
    ],
  };
  const update = await importTender(input(revised));
  expect(update.status).toBe("SOURCE_UPDATE_AVAILABLE");
  expect((await importTender(input(revised))).status).toBe(
    "SOURCE_UPDATE_AVAILABLE",
  );
  let current = await db.tender.findUniqueOrThrow({
    where: { id: old.id },
    include: { items: true },
  });
  expect(current.title).toBe("Employee edited title");
  expect(current.items[0].quantity).toBe(9);
  const link = await db.externalTenderImport.findFirstOrThrow({
    where: { externalTenderId: source.externalTenderId },
  });
  const version = await db.tenderSourceVersion.findFirstOrThrow({
    where: { importId: link.id },
    orderBy: { receivedAt: "desc" },
  });
  await reviewSource(
    old.id,
    {
      versionId: version.id,
      action: "ACCEPT",
      expectedUpdatedAt: current.updatedAt.toISOString(),
      fields: ["deadline"],
      items: [
        { id: "line1", quantity: 4 },
        { id: "line3", quantity: 5 },
      ],
    },
    actor,
  );
  current = await db.tender.findUniqueOrThrow({
    where: { id: old.id },
    include: { items: true },
  });
  expect(current.title).toBe("Employee edited title");
  expect(current.institutionName).toBe("Employee institution");
  expect(current.items.map((i) => i.quantity)).toEqual([4, 5]);
  expect(current.deadline!.toISOString()).toBe("2026-11-01T12:00:00.000Z");
  expect(
    await db.tenderSourceVersion.count({ where: { importId: link.id } }),
  ).toBe(2);
  await expect(
    reviewSource(
      old.id,
      {
        versionId: version.id,
        action: "KEEP",
        expectedUpdatedAt: current.updatedAt.toISOString(),
      },
      actor,
    ),
  ).rejects.toThrow("already been reviewed");
});
it("supports keeping employee values and rejects stale reviews and invented item ids", async () => {
  const result = await importTender(
    input({ ...source, title: "Another source revision" }),
  );
  const current = await db.tender.findUniqueOrThrow({
    where: { id: result.tenderId },
  });
  const link = await db.externalTenderImport.findFirstOrThrow({
    where: { externalTenderId: source.externalTenderId },
  });
  const version = await db.tenderSourceVersion.findFirstOrThrow({
    where: { importId: link.id },
    orderBy: { receivedAt: "desc" },
  });
  await expect(
    reviewSource(
      current.id,
      {
        versionId: version.id,
        action: "ACCEPT",
        expectedUpdatedAt: "2020-01-01T00:00:00Z",
        fields: ["title"],
      },
      actor,
    ),
  ).rejects.toThrow("changed");
  await expect(
    reviewSource(
      current.id,
      {
        versionId: version.id,
        action: "ACCEPT",
        expectedUpdatedAt: current.updatedAt.toISOString(),
        items: [{ id: "invented", quantity: 1 }],
      },
      actor,
    ),
  ).rejects.toThrow("not found");
  await reviewSource(
    current.id,
    {
      versionId: version.id,
      action: "KEEP",
      expectedUpdatedAt: current.updatedAt.toISOString(),
    },
    actor,
  );
  expect(
    (await db.tender.findUniqueOrThrow({ where: { id: current.id } })).title,
  ).toBe("Employee edited title");
});
it("keeps failure health and audits free of secret/error input", async () => {
  await recordFailure(401);
  const health = await integrationHealth();
  expect(health.configured).toBe(true);
  expect(health.lastSuccessAt).not.toBeNull();
  expect(health.failureReason).toBe(
    "Integration or employee authorization failed",
  );
  expect(JSON.stringify(health)).not.toContain(
    process.env.TENDER_TRACKER_INTEGRATION_SECRET,
  );
  const logs = await db.auditLog.findMany({
    where: { action: { startsWith: "TRACKER_" } },
  });
  expect(logs.some((a) => a.action === "TRACKER_SOURCE_ACCEPTED")).toBe(true);
  expect(logs.some((a) => a.action === "TRACKER_SOURCE_KEPT")).toBe(true);
  expect(JSON.stringify(logs)).not.toContain(grant);
});
it("enforces durable rate limits and current employee permissions", async () => {
  await rateLimit("test-limit", 1);
  await expect(rateLimit("test-limit", 1)).rejects.toThrow("Too many");
  await db.user.update({ where: { id: actor.id }, data: { role: "EMPLOYEE" } });
  await expect(grantActor(grant)).rejects.toThrow("permission");
  await db.user.update({ where: { id: actor.id }, data: { role: "ADMIN" } });
});
it("does not merge distinct numbered tenders sharing a listing page or notice PDF", async () => {
  const first = await importTender(
    input({
      ...source,
      externalTenderId: "shared-notice-one",
      number: "NOTICE-ONE",
    }),
  );
  const second = await importTender(
    input({
      ...source,
      externalTenderId: "shared-notice-two",
      number: "NOTICE-TWO",
    }),
  );
  expect(first.tenderId).not.toBe(second.tenderId);
  expect(first.status).toBe("ADDED");
  expect(second.status).toBe("ADDED");
});
it("upgrades legacy fingerprints without duplicating reordered source metadata", async () => {
  const tender = {
    ...source,
    externalTenderId: "SYNTHETIC-LEGACY-HASH",
    number: "SYNTHETIC-LEGACY-HASH",
    documents: [
      ...source.documents,
      { label: "BOQ", url: "https://hospital.example/boq.pdf" },
    ],
  };
  const first = await importTender(input(tender));
  const link = await db.externalTenderImport.findFirstOrThrow({
    where: { tenderId: first.tenderId },
  });
  const version = await db.tenderSourceVersion.findFirstOrThrow({
    where: { importId: link.id },
  });
  const { discoveredAt, sourceUpdatedAt, ...content } =
    version.snapshot as Record<string, unknown>;
  void discoveredAt;
  void sourceUpdatedAt;
  await db.tenderSourceVersion.update({
    where: { id: version.id },
    data: {
      fingerprint: createHash("sha256")
        .update(JSON.stringify(content))
        .digest("hex"),
    },
  });
  const repeat = await importTender(
    input({ ...tender, documents: [...tender.documents].reverse() }),
  );
  expect(repeat.tenderId).toBe(first.tenderId);
  expect(
    await db.tenderSourceVersion.count({ where: { importId: link.id } }),
  ).toBe(1);
});

it("connection codes are single-use and logout revokes the handoff grant", async () => {
  const code = await issueCode(sessionId);
  await exchangeCode(code);
  await expect(exchangeCode(code)).rejects.toThrow("expired");
  await db.session.delete({ where: { id: sessionId } });
  await expect(importTender(input())).rejects.toThrow("Reconnect");
});
it("receiver rejects missing/invalid signatures, malformed data and revoked grants", async () => {
  const { POST } =
    await import("@/app/api/integrations/tender-tracker/import/route");
  const path = "/api/integrations/tender-tracker/import";
  const call = (data: unknown, signed = true, alter = false) => {
    const body = JSON.stringify(data),
      ts = String(Date.now());
    const sig = createHmac(
      "sha256",
      process.env.TENDER_TRACKER_INTEGRATION_SECRET!,
    )
      .update(`${ts}\ndevelopment\nPOST\n${path}\n${body}`)
      .digest("hex");
    return POST(
      new Request("http://localhost:3000" + path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(signed
            ? {
                "x-medops-timestamp": ts,
                "x-medops-environment": "development",
                "x-medops-signature": sig,
              }
            : {}),
        },
        body: body + (alter ? " " : ""),
      }),
    );
  };
  expect((await call({}, false)).status).toBe(401);
  expect((await call({}, true, true)).status).toBe(401);
  expect(
    (
      await call({
        grant,
        tender: { ...source, externalTenderId: "" },
        selectedItemIds: [],
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await call({
        grant,
        tender: { ...source, companyDocuments: [] },
        selectedItemIds: [],
      })
    ).status,
  ).toBe(400);
  expect((await call(input())).status).toBe(401);
  const employee = { ...actor, role: "EMPLOYEE" as const, permissions: [] };
  await expect(
    reviewSource(
      "no-access",
      {
        versionId: "x",
        action: "KEEP",
        expectedUpdatedAt: new Date().toISOString(),
      },
      employee,
    ),
  ).rejects.toThrow("permission");
});
