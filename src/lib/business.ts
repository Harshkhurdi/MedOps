import { AppError } from "./errors";
export function cents(value: string | number) {
  const s = String(value);
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(s))
    throw new AppError(
      400,
      "Use a positive amount with at most two decimal places",
    );
  const [whole, fraction = ""] = s.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}
export function money(value: bigint) {
  return `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
}
export function orderTotal(
  items: { quantity: number; unitPrice: string; taxRate: string }[],
) {
  return money(
    items.reduce((sum, item) => {
      const subtotal = cents(item.unitPrice) * BigInt(item.quantity);
      const tax = (subtotal * cents(item.taxRate) + 5000n) / 10000n;
      return sum + subtotal + tax;
    }, 0n),
  );
}
export function outstanding(total: string, receipts: { amount: string }[]) {
  return money(
    cents(total) - receipts.reduce((s, p) => s + cents(p.amount), 0n),
  );
}
export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
export function addMonths(date: Date, months: number) {
  const d = new Date(date),
    day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}
export function daysOverdue(due: Date, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return Math.max(
    0,
    Math.floor(
      (new Date(today + "T00:00:00Z").getTime() -
        Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate())) /
        86400000,
    ),
  );
}
export function validateDelivery(
  ordered: number,
  alreadyDispatched: number,
  quantity: number,
) {
  if (quantity < 1 || alreadyDispatched + quantity > ordered)
    throw new AppError(400, "Dispatched quantity exceeds the order balance");
}
export function renderTemplate(body: string, values: Record<string, string>) {
  const missing = new Set<string>();
  const result = body.replace(
    /{{\s*([a-zA-Z_][\w]*)\s*}}/g,
    (_, key: string) => {
      const value = values[key];
      if (!value?.trim()) {
        missing.add(key);
        return "";
      }
      return value;
    },
  );
  if (missing.size)
    throw new AppError(
      400,
      `Complete these fields: ${[...missing].join(", ")}`,
    );
  return result;
}
