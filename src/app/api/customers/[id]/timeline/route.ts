import { api, AppError } from "@/lib/errors";
import { authorizeResource, canResource } from "@/lib/record-access";
import { collection, delegate } from "@/lib/resources";
import { recordWhere, safeRecord } from "@/lib/record-query";
import { db } from "@/lib/db";
import { invoiceLedger } from "@/lib/revenue";
import { money } from "@/lib/business";
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    const user = await authorizeResource("customers"),
      { id } = await ctx.params;
    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer) throw new AppError(404, "Customer not found");
    const data: Record<string, unknown> = { customer };
    for (const segment of [
      "customer-contacts",
      "interactions",
      "tenders",
      "pipeline",
      "rfqs",
      "orders",
      "equipment",
      "invoices",
      "tickets",
      "amcs",
    ]) {
      if (!canResource(user, segment)) continue;
      const name = collection(segment);
      const where = await recordWhere(name, user, new URLSearchParams());
      const rows = await delegate(name).findMany({
        where: { ...where, customerId: id },
        take: 500,
        orderBy: { createdAt: "desc" },
        ...(segment === "invoices"
          ? { include: { payments: true, adjustments: true } }
          : {}),
      });
      data[segment] = rows.map((row) => safeRecord(name, row, user));
      if (segment === "invoices") {
        const balances = await db.invoice.findMany({
          where: { customerId: id },
          select: {
            total: true,
            payments: { select: { amount: true } },
            adjustments: {
              select: { type: true, amount: true, taxAmount: true },
            },
          },
          take: 10001,
        });
        if (balances.length > 10000)
          throw new AppError(
            413,
            "Customer balance exceeds 10,000 invoices; use a scoped receivables report",
          );
        data.outstanding = money(
          balances.reduce(
            (sum, r) =>
              sum +
              invoiceLedger(r.total, r.payments, r.adjustments).outstanding,
            0n,
          ),
        );
      }
    }
    return Response.json({ ...data, limitPerSection: 500 });
  });
}
