import { api, AppError } from "@/lib/errors";
import { authorize } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordWhere } from "@/lib/record-query";
import { receivables } from "@/lib/reports";
export async function GET(req: Request) {
  return api(async () => {
    const user = await authorize("reports");
    await authorize("invoices");
    const where = await recordWhere(
      "invoices",
      user,
      new URL(req.url).searchParams,
    );
    const count = await db.invoice.count({ where });
    if (count > 10000)
      throw new AppError(
        413,
        "This report currently supports up to 10,000 invoices",
      );
    const invoices = await db.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        payments: { select: { amount: true } },
        adjustments: true,
      },
      take: 10000,
    });
    return Response.json({
      ...receivables(invoices),
      evaluatedAt: new Date().toISOString(),
    });
  });
}
