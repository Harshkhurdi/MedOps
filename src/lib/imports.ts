import { randomUUID } from "node:crypto";
import { z, ZodError } from "zod";
import { db } from "./db";
import { type Actor, can } from "./auth";
import { canResource } from "./record-access";
import { collection, parseResource } from "./resources";
import { configs } from "./ui-config";
import { save } from "./service";
import { AppError } from "./errors";
export const importModules = [
  "customers",
  "manufacturers",
  "products",
  "equipment",
  "warranties",
  "amcs",
  "invoices",
  "payments",
  "parts",
] as const;
export const previewSchema = z
  .object({
    module: z.enum(importModules),
    headers: z.array(z.string().max(500)).min(1).max(60),
    rows: z
      .array(z.array(z.string().max(10000)).max(60))
      .min(1)
      .max(100),
    mapping: z.record(z.string(), z.string().max(500)),
  })
  .strict();
export type ImportResult = {
  row: number;
  status: "VALID" | "REJECTED" | "IMPORTED";
  error?: string;
  id?: string;
};
function access(user: Actor, name: string) {
  if (
    user.role !== "ADMIN" ||
    !can(user, "imports", true) ||
    !canResource(user, name, true)
  )
    throw new AppError(
      403,
      "Historical imports require administrator and module write access",
    );
}
function safeError(e: unknown) {
  if (e instanceof AppError) return e.message;
  if (e instanceof ZodError)
    return e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  if (typeof e === "object" && e && "code" in e) {
    if (e.code === "P2002") return "Duplicate record";
    if (e.code === "P2003") return "Linked record does not exist";
    if (e.code === "P2034") return "Concurrent update; retry this row";
  }
  return "Row could not be saved; check linked IDs and field values";
}
async function duplicateImport(
  name: string,
  raw: Record<string, unknown>,
  tx:
    | typeof db
    | import("@/generated/prisma/client").Prisma.TransactionClient = db,
) {
  if (
    name === "customers" &&
    (await tx.customer.findFirst({
      where: {
        name: { equals: String(raw.name), mode: "insensitive" },
        address: raw.address == null ? null : String(raw.address),
      },
    }))
  )
    throw new AppError(
      409,
      "Matching customer already recorded; use manual entry if this is a different institution",
    );
  if (
    name === "payments" &&
    (await tx.payment.findFirst({
      where: {
        invoiceId: String(raw.invoiceId),
        reference: String(raw.reference),
        amount: String(raw.amount),
        paymentDate: new Date(String(raw.paymentDate)),
      },
    }))
  )
    throw new AppError(409, "Matching payment already recorded");
}
// Retain completed reports, but erase abandoned source rows after their review window.
export async function cleanupExpiredImportPreviews(now = new Date()) {
  return db.bulkImport.deleteMany({
    where: {
      status: "PREVIEW",
      expiresAt: { lte: now },
      leaseUntil: null,
    },
  });
}
export async function previewImport(user: Actor, input: unknown) {
  const v = previewSchema.parse(input);
  access(user, v.module);
  await cleanupExpiredImportPreviews();
  const name = collection(v.module),
    fields = configs[name].fields.filter((f) => f.type !== "items"),
    keys = new Set(fields.map((f) => f.key));
  if (new Set(v.headers).size !== v.headers.length)
    throw new AppError(400, "Use distinct column headings");
  if (Object.keys(v.mapping).some((k) => !keys.has(k)))
    throw new AppError(400, "Unknown destination field in mapping");
  if (Object.values(v.mapping).some((h) => !v.headers.includes(h)))
    throw new AppError(400, "Mapped heading is missing");
  if (
    new Set(Object.values(v.mapping)).size !== Object.values(v.mapping).length
  )
    throw new AppError(400, "Map each source column once");
  const payload: Record<string, unknown>[] = [],
    results: ImportResult[] = [],
    seen = new Set<string>();
  for (let index = 0; index < v.rows.length; index++) {
    const row = v.rows[index],
      raw: Record<string, unknown> = {};
    if (row.length !== v.headers.length)
      throw new AppError(400, "Import row width does not match headings");
    for (const [field, heading] of Object.entries(v.mapping)) {
      const value = row[v.headers.indexOf(heading)].trim();
      if (!value) continue;
      const config = fields.find((f) => f.key === field)!;
      if (config.type === "boolean") {
        if (
          !["true", "false", "yes", "no", "1", "0"].includes(
            value.toLowerCase(),
          )
        )
          throw new AppError(
            400,
            `Row ${index + 1}: use true/false for ${field}`,
          );
        raw[field] = ["true", "yes", "1"].includes(value.toLowerCase());
      } else if (config.type === "multi")
        raw[field] = value
          .split(";")
          .map((x) => x.trim())
          .filter(Boolean);
      else raw[field] = value;
    }
    if (name !== "parts") {
      raw.historical = true;
      raw.recordSource = "FUTURE_IMPORT";
    }
    payload.push(raw);
    const uniqueKeys: Record<string, string> = {
      equipment: "serialNumber",
      parts: "sku",
      invoices: "number",
      amcs: "number",
      customers: "name",
      manufacturers: "name",
    };
    const key = uniqueKeys[name];
    const token = key
      ? `${key}:${String(raw[key]).toLowerCase()}`
      : name === "products"
        ? `${raw.manufacturerId}:${raw.name}:${raw.model ?? ""}`
        : name === "payments"
          ? `${raw.invoiceId}:${raw.reference}:${raw.paymentDate}:${raw.amount}`
          : JSON.stringify(raw);
    let result: ImportResult = { row: index + 1, status: "VALID" };
    try {
      parseResource(name, raw);
      await duplicateImport(name, raw);
      if (seen.has(token)) throw new AppError(409, "Duplicate row within file");
      seen.add(token);
      if (
        name === "payments" &&
        (await db.payment.findFirst({
          where: {
            invoiceId: String(raw.invoiceId),
            reference: String(raw.reference),
            amount: String(raw.amount),
            paymentDate: new Date(String(raw.paymentDate)),
          },
        }))
      )
        throw new AppError(409, "Matching payment already recorded");
      const rollback = new Error("IMPORT_PREVIEW_ROLLBACK");
      await db
        .$transaction(
          async (tx) => {
            await save(name, raw, user, undefined, undefined, tx);
            throw rollback;
          },
          { isolationLevel: "Serializable", timeout: 15000 },
        )
        .catch((e) => {
          if (e !== rollback) throw e;
        });
    } catch (e) {
      result = { row: index + 1, status: "REJECTED", error: safeError(e) };
    }
    results.push(result);
  }
  const batch = await db.bulkImport.create({
    data: {
      module: name,
      ownerId: user.id,
      payload: JSON.parse(JSON.stringify(payload)),
      preview: results,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  await db.auditLog.create({
    data: {
      userId: user.id,
      module: "imports",
      recordId: batch.id,
      action: "IMPORT_PREVIEW",
      details: {
        module: name,
        rows: results.length,
        valid: results.filter((r) => r.status === "VALID").length,
        rejected: results.filter((r) => r.status === "REJECTED").length,
      },
    },
  });
  return {
    id: batch.id,
    module: name,
    preview: results,
    payload,
    expiresAt: batch.expiresAt,
  };
}
export async function confirmImport(user: Actor, id: string) {
  const batch = await db.bulkImport.findUnique({ where: { id } });
  if (!batch || batch.ownerId !== user.id)
    throw new AppError(404, "Import not found");
  access(user, batch.module);
  if (batch.expiresAt < new Date())
    throw new AppError(410, "Import preview expired; upload again");
  const name = collection(batch.module);
  if (batch.status === "COMPLETE")
    return importReport(batch.report as ImportResult[]);
  const runId = randomUUID();
  const claim = await db.bulkImport.updateMany({
    where: {
      id,
      status: { in: ["PREVIEW", "IMPORTING"] },
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
    },
    data: {
      status: "IMPORTING",
      runId,
      leaseUntil: new Date(Date.now() + 60000),
    },
  });
  if (!claim.count)
    throw new AppError(
      409,
      "This import is running. Check its report before retrying",
    );
  const claimed = await db.bulkImport.findUniqueOrThrow({ where: { id } });
  let report = claimed.report as ImportResult[];
  const rows = batch.payload as Record<string, unknown>[],
    preview = batch.preview as ImportResult[];
  for (let index = report.length; index < rows.length; index++) {
    let entry: ImportResult;
    if (preview[index].status === "REJECTED") entry = { ...preview[index] };
    else {
      try {
        entry = await db.$transaction(
          async (tx) => {
            const lease = await tx.bulkImport.findUniqueOrThrow({
              where: { id },
            });
            if (lease.runId !== runId)
              throw new AppError(409, "Import processing lease changed");
            if (
              name === "payments" &&
              (await tx.payment.findFirst({
                where: {
                  invoiceId: String(rows[index].invoiceId),
                  reference: String(rows[index].reference),
                  amount: String(rows[index].amount),
                  paymentDate: new Date(String(rows[index].paymentDate)),
                },
              }))
            )
              throw new AppError(409, "Matching payment already recorded");
            await duplicateImport(name, rows[index], tx);
            const saved = await save(
              name,
              rows[index],
              user,
              undefined,
              undefined,
              tx,
            );
            const result: ImportResult = {
              row: index + 1,
              status: "IMPORTED",
              id: String(saved.id),
            };
            await tx.bulkImport.update({
              where: { id },
              data: {
                report: [...report, result],
                leaseUntil: new Date(Date.now() + 60000),
              },
            });
            return result;
          },
          { isolationLevel: "Serializable", timeout: 15000 },
        );
        report = [...report, entry];
        continue;
      } catch (e) {
        entry = { row: index + 1, status: "REJECTED", error: safeError(e) };
      }
    }
    report = [...report, entry];
    const updated = await db.bulkImport.updateMany({
      where: { id, runId },
      data: { report, leaseUntil: new Date(Date.now() + 60000) },
    });
    if (!updated.count)
      throw new AppError(409, "Import lease changed; refresh the report");
  }
  await db.$transaction(async (tx) => {
    const finished = await tx.bulkImport.updateMany({
      where: { id, runId },
      data: { status: "COMPLETE", leaseUntil: null, runId: null },
    });
    if (!finished.count)
      throw new AppError(409, "Import lease changed; refresh the report");
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "BULK_IMPORT",
        module: "imports",
        recordId: id,
        details: {
          module: name,
          rows: report.length,
          imported: report.filter((r) => r.status === "IMPORTED").length,
          rejected: report.filter((r) => r.status === "REJECTED").length,
        },
      },
    });
  });
  return importReport(report);
}
export function importReport(rows: ImportResult[]) {
  return {
    importedCount: rows.filter((r) => r.status === "IMPORTED").length,
    rejectedCount: rows.filter((r) => r.status === "REJECTED").length,
    rows,
  };
}
