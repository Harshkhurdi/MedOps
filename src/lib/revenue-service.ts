import type { Prisma } from "@/generated/prisma/client";
import { type Actor, can } from "./auth";
import { canResource } from "./record-access";
import { AppError } from "./errors";
import { collection, delegate } from "./resources";
import { cents } from "./business";
import { invoiceLedger } from "./revenue";
export async function prepareRevenue(
  tx: Prisma.TransactionClient,
  name: string,
  data: Record<string, unknown>,
  user: Actor,
  old: Record<string, unknown> | null,
  id?: string,
) {
  for (const f of ["assignedToId", "employeeId"])
    if (
      data[f] &&
      !(await tx.user.findFirst({
        where: { id: String(data[f]), active: true },
      }))
    )
      throw new AppError(400, "Choose an active employee");
  if (name === "interactions") {
    if (data.contactId) {
      const c = await tx.customerContact.findUnique({
        where: { id: String(data.contactId) },
      });
      if (!c?.active || c.customerId !== data.customerId)
        throw new AppError(
          400,
          "Contact must belong to customer and be active",
        );
    }
    if (Boolean(data.relatedModule) !== Boolean(data.recordId))
      throw new AppError(
        400,
        "Related module and record ID must both be entered",
      );
    if (data.relatedModule) {
      const m = collection(String(data.relatedModule));
      if (
        ![
          "tenders",
          "rfqs",
          "orders",
          "tickets",
          "amcs",
          "invoices",
          "payments",
        ].includes(m) ||
        !canResource(user, m)
      )
        throw new AppError(403, "Related module access is required");
      const row = await delegate(m, tx).findUnique({
        where: { id: String(data.recordId) },
      });
      if (!row) throw new AppError(400, "Related record not found");
      const customerId =
        m === "payments"
          ? (
              await tx.invoice.findUnique({
                where: { id: String(row.invoiceId) },
              })
            )?.customerId
          : row.customerId;
      if (customerId && customerId !== data.customerId)
        throw new AppError(400, "Related record belongs to another customer");
    }
    if (data.nextFollowUp && data.nextFollowUp < data.occurredAt!)
      throw new AppError(400, "Follow-up cannot precede interaction");
  }
  if (name === "pipeline") {
    if (data.productId) {
      const p = await tx.product.findUnique({
        where: { id: String(data.productId) },
      });
      if (
        !p ||
        (data.manufacturerId && p.manufacturerId !== data.manufacturerId)
      )
        throw new AppError(400, "Product and manufacturer do not match");
      data.manufacturerId ||= p.manufacturerId;
    }
    if (data.tenderId) {
      const t = await tx.tender.findUnique({
        where: { id: String(data.tenderId) },
      });
      if (!t || (t.customerId && t.customerId !== data.customerId))
        throw new AppError(400, "Tender must match customer");
    }
    if (
      old &&
      ["WON", "LOST"].includes(String(old.stage)) &&
      old.stage !== data.stage
    )
      throw new AppError(409, "Closed opportunity cannot be reopened");
  }
  if (name === "costs") {
    if (data.productId) {
      const p = await tx.product.findUnique({
        where: { id: String(data.productId) },
      });
      if (
        !p ||
        (data.manufacturerId && p.manufacturerId !== data.manufacturerId)
      )
        throw new AppError(400, "Cost product/manufacturer do not match");
      data.manufacturerId ||= p.manufacturerId;
    }
    if (data.orderId) {
      const o = await tx.purchaseOrder.findUnique({
        where: { id: String(data.orderId) },
      });
      if (
        !o ||
        o.customerId !== data.customerId ||
        (data.tenderId && o.tenderId && o.tenderId !== data.tenderId)
      )
        throw new AppError(400, "Cost order must match customer/tender");
      data.tenderId ||= o.tenderId;
    }
    if (data.tenderId) {
      const t = await tx.tender.findUnique({
        where: { id: String(data.tenderId) },
      });
      if (!t || (t.customerId && t.customerId !== data.customerId))
        throw new AppError(400, "Cost tender must match customer");
    }
    if (data.deliveryId) {
      const d = await tx.delivery.findUnique({
        where: { id: String(data.deliveryId) },
        include: { order: true },
      });
      if (
        !d ||
        d.order.customerId !== data.customerId ||
        (data.orderId && d.orderId !== data.orderId)
      )
        throw new AppError(400, "Cost delivery must match customer/order");
      data.orderId ||= d.orderId;
    }
    if (data.installationId) {
      const i = await tx.installation.findUnique({
        where: { id: String(data.installationId) },
        include: { equipment: true },
      });
      if (
        !i ||
        i.equipment.customerId !== data.customerId ||
        (data.orderId && i.equipment.orderId !== data.orderId)
      )
        throw new AppError(400, "Cost installation must match customer/order");
      data.orderId ||= i.equipment.orderId;
    }
    if (data.ticketId) {
      const t = await tx.serviceTicket.findUnique({
        where: { id: String(data.ticketId) },
        include: { equipment: true },
      });
      if (
        !t ||
        t.customerId !== data.customerId ||
        (data.orderId && t.equipment?.orderId !== data.orderId)
      )
        throw new AppError(
          400,
          "Cost service ticket must match customer/order",
        );
      data.orderId ||= t.equipment?.orderId;
    }
    if (data.deliveryId || data.installationId || data.ticketId)
      data.postSale = true;
    if (
      data.ticketId ||
      ["SERVICE", "WARRANTY_SUPPORT", "SPARE_PARTS"].includes(
        String(data.category),
      )
    )
      data.serviceCost = true;
  }
  if (name === "adjustments") {
    if (id) throw new AppError(405, "Financial corrections are immutable");
    if (!can(user, "finance-adjust", true))
      throw new AppError(403, "Financial adjustment permission is required");
    if (!canResource(user, "invoices", true))
      throw new AppError(403, "Invoice edit permission is required");
    const invoice = await tx.invoice.findUnique({
      where: { id: String(data.invoiceId) },
      include: { payments: true, adjustments: true, order: true },
    });
    if (!invoice) throw new AppError(400, "Invoice not found");
    if ((data.adjustmentDate as Date) < invoice.invoiceDate)
      throw new AppError(400, "Correction cannot precede invoice");
    if (data.type === "PAYMENT_REVERSAL") {
      const payment = invoice.payments.find((p) => p.id === data.paymentId);
      if (!payment)
        throw new AppError(400, "Choose a payment from this invoice");
      if (cents(String(data.taxAmount)) !== 0n)
        throw new AppError(400, "Payment reversal tax must be zero");
      if ((data.adjustmentDate as Date) < payment.paymentDate)
        throw new AppError(400, "Reversal cannot precede payment");
      const reversed = invoice.adjustments
        .filter(
          (a) => a.type === "PAYMENT_REVERSAL" && a.paymentId === payment.id,
        )
        .reduce((s, a) => s + cents(String(a.amount)), 0n);
      if (reversed + cents(String(data.amount)) > cents(String(payment.amount)))
        throw new AppError(400, "Reversal exceeds original receipt");
    } else if (data.paymentId)
      throw new AppError(400, "Payment link is only for receipt reversal");
    if (data.type !== "PAYMENT_REVERSAL") {
      const all = [
        ...invoice.adjustments,
        {
          type: String(data.type),
          amount: data.amount,
          taxAmount: data.taxAmount,
        },
      ];
      const base =
        cents(String(invoice.amount)) +
        all
          .filter((a) => a.type !== "PAYMENT_REVERSAL")
          .reduce(
            (s, a) =>
              s +
              (a.type === "INVOICE_DEBIT" ? 1n : -1n) * cents(String(a.amount)),
            0n,
          );
      const tax =
        cents(String(invoice.taxAmount)) +
        all
          .filter((a) => a.type !== "PAYMENT_REVERSAL")
          .reduce(
            (s, a) =>
              s +
              (a.type === "INVOICE_DEBIT" ? 1n : -1n) *
                cents(String(a.taxAmount ?? 0)),
            0n,
          );
      if (base < 0n || tax < 0n)
        throw new AppError(
          400,
          "Correction would create a negative invoice base or tax balance",
        );
    }
    const ledger = invoiceLedger(invoice.total, invoice.payments, [
      ...invoice.adjustments,
      {
        type: String(data.type),
        amount: data.amount,
        taxAmount: data.taxAmount,
      },
    ]);
    if (ledger.charged < 0n || ledger.received < 0n || ledger.outstanding < 0n)
      throw new AppError(
        400,
        "Correction would create a negative invoice or an overpayment",
      );
    if (data.type === "INVOICE_DEBIT" && invoice.order) {
      const others = await tx.invoice.findMany({
        where: { orderId: invoice.orderId! },
        include: { payments: true, adjustments: true },
      });
      const charged =
        others.reduce(
          (s, i) =>
            s + invoiceLedger(i.total, i.payments, i.adjustments).charged,
          0n,
        ) +
        cents(String(data.amount)) +
        cents(String(data.taxAmount));
      if (charged > cents(String(invoice.order.total)))
        throw new AppError(400, "Correction exceeds official order total");
    }
    delete data.confirmed;
    data.actorId = user.id;
  }
  return data;
}
