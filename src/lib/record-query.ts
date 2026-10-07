import { canResource } from "./record-access";
import { type Actor, can } from "./auth";
import { resources, type Collection } from "./resources";
import { db } from "./db";
import { configs } from "./ui-config";
import { AppError } from "./errors";
import { outstanding } from "./business";
export async function recordWhere(
  name: Collection,
  user: Actor,
  params: URLSearchParams,
) {
  const where: Record<string, unknown> = {};
  const q = (params.get("q") ?? "").slice(0, 200);
  if (q)
    where.OR = resources[name].search.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
  if (["approvals", "mail"].includes(name) && user.role !== "ADMIN")
    where.relatedModule = {
      in: Object.keys(resources).filter((m) => canResource(user, m)),
    };
  if (name === "notifications") {
    where.userId = user.id;
    where.dismissedAt = null;
    if (user.role !== "ADMIN") {
      const allowed = user.permissions
        .filter((p) => p.read)
        .map((p) => p.module);
      where.module = { in: allowed };
      const tasks = allowed.includes("tasks")
        ? await db.task.findMany({
            where: {
              OR: [{ createdById: user.id }, { assignedToId: user.id }],
            },
            select: { id: true },
          })
        : [];
      where.AND = [
        {
          OR: [
            { module: { not: "tasks" } },
            { module: "tasks", recordId: { in: tasks.map((t) => t.id) } },
          ],
        },
      ];
    }
  }
  if (name === "generated" && user.role !== "ADMIN")
    where.sourceModule = {
      in: user.permissions.filter((p) => p.read).map((p) => p.module),
    };
  if (name === "tasks" && user.role !== "ADMIN")
    where.AND = [{ OR: [{ createdById: user.id }, { assignedToId: user.id }] }];
  const status = params.get("status");
  const statuses = configs[name]?.fields.find(
    (f) => f.key === "status",
  )?.options;
  if (status && statuses) {
    if (!statuses.includes(status))
      throw new AppError(400, "Choose a valid status");
    where.status = status;
  }
  const parentFields: Record<string, string> = {
    checklist: "tenderId",
    securities: "tenderId",
    "rfq-followups": "rfqId",
    requirements: "tenderId",
    generated: "tenderId",
    deliveries: "orderId",
    installations: "equipmentId",
    warranties: "equipmentId",
    visits: "amcId",
    payments: "invoiceId",
    followups: "invoiceId",
  };
  const parent = params.get("parent");
  if (parent && parentFields[name]) where[parentFields[name]] = parent;
  return where;
}
export function safeRecord(name: Collection, row: Record<string, unknown>) {
  if (name === "quotes") {
    const series = row.series as Record<string, unknown>;
    return {
      ...row,
      manufacturerId: series.manufacturerId,
      rfqId: series.rfqId,
      tenderId: series.tenderId,
      productId: series.productId,
      manufacturer: series.manufacturer,
    };
  }
  if (name === "users") {
    const { passwordHash: _, ...safe } = row;
    void _;
    return safe;
  }
  if (name === "invoices")
    return {
      ...row,
      outstanding: outstanding(
        String(row.total),
        ((row.payments ?? []) as { amount: unknown }[]).map((p) => ({
          amount: String(p.amount),
        })),
      ),
    };
  return row;
}
export async function assertNotificationScope(
  user: Actor,
  row: Record<string, unknown>,
) {
  if (row.userId !== user.id || !can(user, String(row.module)))
    throw new AppError(404, "Notification not found");
  if (
    user.role !== "ADMIN" &&
    row.module === "tasks" &&
    !(await db.task.findFirst({
      where: {
        id: String(row.recordId),
        OR: [{ createdById: user.id }, { assignedToId: user.id }],
      },
    }))
  )
    throw new AppError(404, "Notification not found");
}
