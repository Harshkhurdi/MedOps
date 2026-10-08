import { reportDates } from "./management-dates";
import { invoiceLedger } from "./revenue";
import { signedMoney } from "./commercial";
import { canResource } from "./record-access";
import { type Actor, can } from "./auth";
import { resources, type Collection } from "./resources";
import { db } from "./db";
import { configs } from "./ui-config";
import { AppError } from "./errors";

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
  if (name === "interactions" && user.role !== "ADMIN")
    where.AND = [
      {
        OR: [
          { relatedModule: null },
          {
            relatedModule: {
              in: Object.keys(resources).filter((m) => canResource(user, m)),
            },
          },
        ],
      },
    ];
  if (name === "notifications") {
    where.userId = user.id;
    where.dismissedAt = null;
    where.completedAt = null;
    if (user.role !== "ADMIN") {
      const allowed = user.permissions
        .filter((p) => p.read && canResource(user, p.module))
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
      in: user.permissions
        .filter((p) => p.read && canResource(user, p.module))
        .map((p) => p.module),
    };
  if (name === "tasks" && user.role !== "ADMIN")
    where.AND = [{ OR: [{ createdById: user.id }, { assignedToId: user.id }] }];
  const status = params.get("status");
  const statusField = configs[name]?.fields.find(
    (f) =>
      f.key === "status" ||
      f.key === "stage" ||
      f.key === "outcome" ||
      f.key === "decision",
  );
  const statuses = statusField?.options;
  if (status && statuses) {
    if (!statuses.includes(status))
      throw new AppError(400, "Choose a valid status");
    where[statusField!.key] = status;
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
  const { start, end } = reportDates(params);
  const dateFields: Record<string, string> = {
    tenders: "publicationDate",
    decisions: "decisionAt",
    rfqs: "createdAt",
    quotes: "quotationDate",
    securities: "issueDate",
    orders: "poDate",
    deliveries: "actualDate",
    equipment: "originalDate",
    installations: "installationDate",
    warranties: "endDate",
    amcs: "startDate",
    invoices: "invoiceDate",
    payments: "paymentDate",
    costs: "incurredDate",
    adjustments: "adjustmentDate",
    tasks: "dueDate",
    tickets: "reportedAt",
    "ticket-visits": "scheduledAt",
    visits: "scheduledDate",
    interactions: "occurredAt",
  };
  if (start || end)
    where[dateFields[name] ?? "createdAt"] = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    };
  const dimensionFields = [
    "customerId",
    "manufacturerId",
    "productId",
    "employeeId",
    "assignedToId",
    "engineerId",
  ];
  for (const dimension of dimensionFields) {
    const value = params.get(dimension);
    if (!value) continue;
    if (
      name === "quotes" &&
      ["manufacturerId", "productId"].includes(dimension)
    ) {
      where.series = {
        ...((where.series as object) ?? {}),
        [dimension]: value,
      };
      continue;
    }
    if (configs[name]?.fields.some((f) => f.key === dimension))
      where[dimension] = value;
    else if (
      dimension === "customerId" &&
      ["warranties", "installations"].includes(name)
    )
      where.equipment = { customerId: value };
    else if (dimension === "customerId" && name === "deliveries")
      where.order = { customerId: value };
    else if (
      dimension === "customerId" &&
      ["payments", "adjustments", "followups"].includes(name)
    )
      where.invoice = { customerId: value };
    else if (
      dimension === "manufacturerId" &&
      ["orders", "tenders"].includes(name)
    )
      where.items = {
        some: {
          ...((where.items as { some?: object })?.some ?? {}),
          manufacturerId: value,
        },
      };
    else if (dimension === "productId" && ["orders", "tenders"].includes(name))
      where.items = {
        some: {
          ...((where.items as { some?: object })?.some ?? {}),
          productId: value,
        },
      };
    else
      throw new AppError(
        400,
        `This register does not support the ${dimension} filter`,
      );
  }
  return where;
}
export function safeRecord(
  name: Collection,
  row: Record<string, unknown>,
  user?: Actor,
) {
  if (name === "parts") {
    const safe: Record<string, unknown> = {
      ...row,
      availableQuantity: Number(row.onHand) - Number(row.reserved),
    };
    if (user && !can(user, "pricing")) delete safe.unitCost;
    return safe;
  }
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
  if (name === "invoices") {
    const ledger = invoiceLedger(
      row.total,
      (row.payments ?? []) as { amount: unknown }[],
      (row.adjustments ?? []) as {
        type: string;
        amount: unknown;
        taxAmount?: unknown;
      }[],
    );
    const result: Record<string, unknown> = {
      ...row,
      adjustedTotal: signedMoney(ledger.charged),
      effectiveReceived: signedMoney(ledger.received),
      outstanding: signedMoney(ledger.outstanding),
    };
    if (user && !canResource(user, "adjustments")) delete result.adjustments;
    if (user && !canResource(user, "payments")) delete result.payments;
    return result;
  }
  return row;
}
export async function assertNotificationScope(
  user: Actor,
  row: Record<string, unknown>,
) {
  if (row.userId !== user.id || !canResource(user, String(row.module)))
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
