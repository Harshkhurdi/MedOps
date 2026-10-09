import { type Actor } from "./auth";
import { canResource } from "./record-access";
import { db } from "./db";
import { addDays } from "./business";
import { invoiceLedger } from "./revenue";
import { recordWhere } from "./record-query";
export type BriefAction = {
  module: string;
  id: string;
  label: string;
  action: string;
  dueAt: Date | null;
  priority: string;
  employeeId: string | null;
  href: string;
};
export async function todaysBrief(
  user: Actor,
  params: URLSearchParams,
  now = new Date(),
) {
  const actions: BriefAction[] = [],
    until = addDays(now, 7),
    shifted = new Date(+now + 19800000),
    start = new Date(
      Date.UTC(
        shifted.getUTCFullYear(),
        shifted.getUTCMonth(),
        shifted.getUTCDate(),
      ) - 19800000,
    );
  const end = addDays(start, 1);
  const add = (
    module: string,
    id: string,
    label: string,
    action: string,
    dueAt: Date | null = null,
    employeeId: string | null = null,
    priority = "NORMAL",
  ) =>
    actions.push({
      module,
      id,
      label,
      action,
      dueAt,
      employeeId,
      priority:
        dueAt && dueAt < now && priority !== "CRITICAL" ? "HIGH" : priority,
      href: `/${module}?record=${id}`,
    });
  if (canResource(user, "tenders"))
    for (const t of await db.tender.findMany({
      where: { status: { notIn: ["WON", "LOST", "CANCELLED"] } },
      include: {
        decisions: canResource(user, "decisions")
          ? { orderBy: { decisionAt: "desc" }, take: 1 }
          : false,
        checklist: true,
        requirements: true,
      },
      take: 500,
    })) {
      if (t.deadline && t.deadline <= until)
        add("tenders", t.id, t.number, "Closing soon", t.deadline);
      if (
        canResource(user, "decisions") &&
        (!t.decisions?.[0] ||
          t.decisions[0].decision === "PENDING_REVIEW" ||
          t.decisions[0].decision === "REVIEW_LATER")
      )
        add("tenders", t.id, t.number, "Awaiting decision");
      if (
        t.checklist.some(
          (c) => !["COMPLETE", "NOT_APPLICABLE"].includes(c.status),
        ) ||
        t.requirements.some((r) => r.compliance === "REQUIRES_REVIEW")
      )
        add("tenders", t.id, t.number, "Missing documents / compliance review");
    }
  if (canResource(user, "rfqs"))
    for (const r of await db.rfq.findMany({
      where: {
        status: { in: ["SENT", "AWAITING_RESPONSE", "REVISION_REQUESTED"] },
      },
      take: 500,
    }))
      add(
        "rfqs",
        r.id,
        r.number,
        "Awaiting quotation",
        r.quoteRequiredBy,
        r.assignedToId,
      );
  if (canResource(user, "rfq-followups"))
    for (const f of await db.rfqFollowUp.findMany({
      where: { nextDate: { lte: end } },
      include: { rfq: { select: { number: true, status: true } } },
      take: 500,
    }))
      if (
        !["CLOSED", "CANCELLED", "FINAL_QUOTE_RECEIVED"].includes(f.rfq.status)
      )
        add(
          "rfq-followups",
          f.id,
          f.rfq.number,
          "RFQ follow-up due",
          f.nextDate,
          f.employeeId,
        );
  if (canResource(user, "quotes"))
    for (const s of await db.quoteSeries.findMany({
      include: { revisions: { orderBy: { revision: "desc" }, take: 1 } },
      take: 500,
    })) {
      const q = s.revisions[0];
      if (q?.validityDate && q.validityDate <= addDays(now, 30))
        add(
          "quotes",
          q.id,
          q.number,
          "Quote validity expiring",
          q.validityDate,
        );
    }
  if (canResource(user, "securities"))
    for (const s of await db.security.findMany({
      where: {
        status: { notIn: ["REFUNDED", "RELEASED", "INVOKED", "CANCELLED"] },
      },
      take: 500,
    })) {
      if (s.validityDate && s.validityDate <= addDays(now, 90))
        add(
          "securities",
          s.id,
          s.reference,
          "Security expiring",
          s.validityDate,
          s.assignedToId,
        );
      if (s.expectedRefundDate && s.expectedRefundDate <= end)
        add(
          "securities",
          s.id,
          s.reference,
          "Refund overdue / due",
          s.expectedRefundDate,
          s.assignedToId,
        );
    }
  if (canResource(user, "orders"))
    for (const o of await db.purchaseOrder.findMany({
      where: {
        status: { notIn: ["DELIVERED", "COMPLETED", "CANCELLED"] },
        deliveryDeadline: { lte: until },
      },
      take: 500,
    }))
      add("orders", o.id, o.number, "Delivery due", o.deliveryDeadline);
  if (canResource(user, "deliveries"))
    for (const d of await db.delivery.findMany({
      where: { confirmed: false, expectedDate: { lte: until } },
      include: { order: { select: { number: true } } },
      take: 500,
    }))
      add("deliveries", d.id, d.order.number, "Delivery due", d.expectedDate);
  if (canResource(user, "installations"))
    for (const e of await db.equipment.findMany({
      where: {
        OR: [
          { installation: null },
          { installation: { status: { in: ["PENDING", "PARTIAL"] } } },
        ],
      },
      take: 500,
    }))
      add("equipment", e.id, e.serialNumber, "Installation pending");
  if (canResource(user, "tickets"))
    for (const t of await db.serviceTicket.findMany({
      where: { status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } },
      take: 500,
    }))
      if (t.priority === "CRITICAL" || t.status === "WAITING_FOR_PARTS")
        add(
          "tickets",
          t.id,
          t.number,
          t.status === "WAITING_FOR_PARTS"
            ? "Awaiting parts"
            : "Critical ticket",
          t.resolutionDueAt,
          t.assignedToId,
          t.priority === "CRITICAL" ? "HIGH" : "NORMAL",
        );
  if (canResource(user, "ticket-visits"))
    for (const v of await db.ticketVisit.findMany({
      where: {
        status: { in: ["SCHEDULED", "STARTED"] },
        scheduledAt: { lt: end },
      },
      include: { ticket: { select: { number: true } } },
      take: 500,
    }))
      add(
        "ticket-visits",
        v.id,
        v.ticket.number,
        v.scheduledAt < start ? "Overdue visit" : "Today's visit",
        v.scheduledAt,
        v.engineerId,
      );
  if (canResource(user, "parts"))
    for (const p of await db.sparePart.findMany({
      where: { active: true },
      take: 500,
    }))
      if (p.onHand - p.reserved <= p.reorderLevel)
        add("parts", p.id, p.sku, "Low available stock", null, null, "HIGH");
  for (const [key, model] of [
    ["amc-opportunities", db.amcOpportunity],
    ["consumable-opportunities", db.consumableOpportunity],
  ] as const)
    if (canResource(user, key)) {
      const rows =
        key === "amc-opportunities"
          ? await db.amcOpportunity.findMany({
              where: { status: { notIn: ["WON", "LOST", "NOT_APPLICABLE"] } },
              include: { equipment: { select: { serialNumber: true } } },
              take: 500,
            })
          : await db.consumableOpportunity.findMany({
              where: { status: { notIn: ["WON", "LOST", "NOT_APPLICABLE"] } },
              include: { equipment: { select: { serialNumber: true } } },
              take: 500,
            });
      void model;
      for (const o of rows) {
        const due = "followUpDate" in o ? o.followUpDate : o.nextFollowUp;
        if (!due || due <= end)
          add(
            key,
            o.id,
            o.equipment?.serialNumber ?? o.id,
            "Opportunity follow-up",
            due,
            o.assignedToId,
          );
      }
    }
  if (canResource(user, "amcs"))
    for (const contract of await db.amcContract.findMany({
      where: { status: "ACTIVE", endDate: { lte: addDays(now, 90) } },
      take: 500,
    }))
      add(
        "amcs",
        contract.id,
        contract.number,
        "AMC renewal due",
        contract.endDate,
      );
  if (canResource(user, "invoices"))
    for (const i of await db.invoice.findMany({
      where: { dueDate: { lt: now } },
      include: { payments: true, adjustments: true },
      take: 500,
    }))
      if (invoiceLedger(i.total, i.payments, i.adjustments).outstanding > 0n)
        add("invoices", i.id, i.number, "Invoice overdue", i.dueDate);
  if (canResource(user, "followups"))
    for (const f of await db.paymentFollowUp.findMany({
      where: { nextDate: { lte: end } },
      include: { invoice: { include: { payments: true, adjustments: true } } },
      take: 500,
    }))
      if (
        invoiceLedger(
          f.invoice.total,
          f.invoice.payments,
          f.invoice.adjustments,
        ).outstanding > 0n
      )
        add(
          "followups",
          f.id,
          f.invoice.number,
          "Payment follow-up due",
          f.nextDate,
          f.employeeId,
        );
  if (canResource(user, "interactions"))
    for (const f of await db.customerInteraction.findMany({
      where: {
        ...(await recordWhere("interactions", user, new URLSearchParams())),
        nextFollowUp: { lte: end },
      },
      include: { customer: { select: { name: true } } },
      take: 500,
    }))
      add(
        "interactions",
        f.id,
        f.customer.name,
        "Customer follow-up due",
        f.nextFollowUp,
        f.employeeId,
      );
  if (canResource(user, "tasks"))
    for (const t of await db.task.findMany({
      where: {
        ...(await recordWhere("tasks", user, new URLSearchParams())),
        status: { in: ["OPEN", "IN_PROGRESS"] },
        dueDate: { lt: end },
      },
      take: 500,
    }))
      add(
        "tasks",
        t.id,
        t.title,
        t.dueDate && t.dueDate < start ? "Overdue task" : "Task due today",
        t.dueDate,
        t.assignedToId,
        t.priority,
      );
  return actions
    .filter(
      (a) =>
        (!params.get("module") || a.module === params.get("module")) &&
        (!params.get("employeeId") ||
          a.employeeId === params.get("employeeId")) &&
        (!params.get("priority") || a.priority === params.get("priority")) &&
        canResource(user, a.module),
    )
    .sort(
      (a, b) =>
        (({ CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 })[
          a.priority as "CRITICAL" | "HIGH" | "NORMAL" | "LOW"
        ] ?? 2) -
          ({ CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 }[
            b.priority as "CRITICAL" | "HIGH" | "NORMAL" | "LOW"
          ] ?? 2) || +(a.dueAt ?? until) - +(b.dueAt ?? until),
    );
}
