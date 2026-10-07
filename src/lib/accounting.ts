import { db } from "./db";
import { type Actor } from "./auth";
import { canResource } from "./record-access";
import { AppError } from "./errors";
import { recordWhere } from "./record-query";
import { invoiceLedger } from "./revenue";
import { money } from "./business";
export const accountingProviders = {
  manual: { available: true, label: "CSV / Excel interchange" },
  tally: { available: false, label: "Tally connector — not configured" },
  zoho: { available: false, label: "Zoho Books connector — not configured" },
};
export const accountingModules = [
  "customers",
  "orders",
  "invoices",
  "payments",
  "adjustments",
] as const;
export async function accountingRows(
  user: Actor,
  name: (typeof accountingModules)[number],
  params: URLSearchParams,
) {
  if (!canResource(user, name))
    throw new AppError(403, "Register access is required");
  const where = await recordWhere(name, user, params);
  const limit = 5000;
  if (name === "customers") {
    const rows = await db.customer.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: "asc" },
    });
    if (rows.length > limit)
      throw new AppError(413, "Narrow export to 5,000 records");
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address ?? "",
      email: r.email ?? "",
      phone: r.phone ?? "",
      state: r.state ?? "",
    }));
  }
  if (name === "orders") {
    const rows = await db.purchaseOrder.findMany({
      where,
      take: limit + 1,
      include: { items: true },
      orderBy: { poDate: "asc" },
    });
    if (rows.length > limit)
      throw new AppError(413, "Narrow export to 5,000 records");
    return rows.map((r) => ({
      id: r.id,
      number: r.number,
      customerId: r.customerId,
      tenderId: r.tenderId ?? "",
      date: r.poDate.toISOString().slice(0, 10),
      status: r.status,
      total: String(r.total),
      currency: "INR",
      items: JSON.stringify(
        r.items.map((i) => ({
          productId: i.productId,
          description: i.equipment,
          quantity: i.quantity,
          unitPrice: String(i.unitPrice),
          taxRate: String(i.taxRate),
        })),
      ),
    }));
  }
  if (name === "invoices") {
    const rows = await db.invoice.findMany({
      where,
      take: limit + 1,
      include: { payments: true, adjustments: true },
      orderBy: { invoiceDate: "asc" },
    });
    if (rows.length > limit)
      throw new AppError(413, "Narrow export to 5,000 records");
    return rows.map((r) => {
      const l = invoiceLedger(r.total, r.payments, r.adjustments);
      return {
        id: r.id,
        number: r.number,
        customerId: r.customerId,
        orderId: r.orderId ?? "",
        date: r.invoiceDate.toISOString().slice(0, 10),
        dueDate: r.dueDate.toISOString().slice(0, 10),
        baseAmount: String(r.amount),
        taxAmount: String(r.taxAmount),
        originalTotal: String(r.total),
        adjustedTotal: money(l.charged),
        effectiveReceived: money(l.received),
        outstanding: money(l.outstanding),
        currency: "INR",
      };
    });
  }
  if (name === "payments") {
    const rows = await db.payment.findMany({
      where,
      take: limit + 1,
      include: { adjustments: true },
      orderBy: { paymentDate: "asc" },
    });
    if (rows.length > limit)
      throw new AppError(413, "Narrow export to 5,000 records");
    return rows.map((r) => ({
      id: r.id,
      invoiceId: r.invoiceId,
      date: r.paymentDate.toISOString().slice(0, 10),
      amount: String(r.amount),
      method: r.method,
      reference: r.reference,
      currency: "INR",
      reversals: JSON.stringify(
        r.adjustments.map((a) => ({
          id: a.id,
          reference: a.reference,
          date: a.adjustmentDate.toISOString().slice(0, 10),
          amount: String(a.amount),
        })),
      ),
    }));
  }
  const rows = await db.financialAdjustment.findMany({
    where,
    take: limit + 1,
    orderBy: { adjustmentDate: "asc" },
  });
  if (rows.length > limit)
    throw new AppError(413, "Narrow export to 5,000 records");
  return rows.map((r) => ({
    id: r.id,
    invoiceId: r.invoiceId,
    paymentId: r.paymentId ?? "",
    type: r.type,
    date: r.adjustmentDate.toISOString().slice(0, 10),
    reference: r.reference,
    amount: String(r.amount),
    taxAmount: String(r.taxAmount),
    reason: r.reason,
    currency: "INR",
  }));
}
