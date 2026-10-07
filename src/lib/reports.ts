import { invoiceLedger, type Adjustment } from "./revenue";
import { money, daysOverdue } from "./business";
export type LedgerInvoice = {
  id: string;
  number: string;
  total: unknown;
  dueDate: Date;
  customer: { id: string; name: string };
  payments: { amount: unknown }[];
  adjustments?: Adjustment[];
};
export function receivables(invoices: LedgerInvoice[], now = new Date()) {
  const buckets = [
    "Not overdue",
    "1–30 days",
    "31–60 days",
    "61–90 days",
    "Over 90 days",
  ];
  const aging = buckets.map((label) => ({ label, amount: 0n, count: 0 }));
  const customers = new Map<
    string,
    { id: string; name: string; amount: bigint; overdue: bigint }
  >();
  let invoiced = 0n,
    received = 0n,
    outstanding = 0n,
    overdue = 0n;
  const rows = [];
  for (const invoice of invoices) {
    const ledger = invoiceLedger(invoice.total, invoice.payments, invoice.adjustments);
    const total = ledger.charged, paid = ledger.received, balance = ledger.outstanding;
    invoiced += total;
    received += paid;
    outstanding += balance;
    if (balance <= 0n) continue;
    const days = daysOverdue(invoice.dueDate, now),
      bucket =
        days === 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
    aging[bucket].amount += balance;
    aging[bucket].count++;
    const customer = customers.get(invoice.customer.id) ?? {
      ...invoice.customer,
      amount: 0n,
      overdue: 0n,
    };
    customer.amount += balance;
    if (days > 0) {
      overdue += balance;
      customer.overdue += balance;
    }
    customers.set(invoice.customer.id, customer);
    rows.push({
      id: invoice.id,
      number: invoice.number,
      customer: invoice.customer.name,
      dueDate: invoice.dueDate,
      daysOverdue: days,
      outstanding: money(balance),
      bucket: buckets[bucket],
    });
  }
  return {
    invoiced: money(invoiced),
    received: money(received),
    outstanding: money(outstanding),
    overdue: money(overdue),
    aging: aging.map((a) => ({ ...a, amount: money(a.amount) })),
    customers: [...customers.values()].map((c) => ({
      ...c,
      amount: money(c.amount),
      overdue: money(c.overdue),
    })),
    invoices: rows.sort((a, b) => b.daysOverdue - a.daysOverdue),
  };
}
export function csvCell(value: string) {
  const safe =
    /^[\s]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}
