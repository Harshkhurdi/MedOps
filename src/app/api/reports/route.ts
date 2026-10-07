import { api, AppError } from "@/lib/errors";
import { authorize } from "@/lib/auth";
import { db } from "@/lib/db";
import { receivables } from "@/lib/reports";
export async function GET() {
  return api(async () => {
    await authorize("reports");
    await authorize("invoices");
    const count = await db.invoice.count();
    if (count > 10000)
      throw new AppError(
        413,
        "This report currently supports up to 10,000 invoices",
      );
    const invoices = await db.invoice.findMany({
      include: {
        customer: { select: { id: true, name: true } },
        payments: { select: { amount: true } },
      },
      take: 10000,
    });
    return Response.json({
      ...receivables(invoices),
      evaluatedAt: new Date().toISOString(),
    });
  });
}
