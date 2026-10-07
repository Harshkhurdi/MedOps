import { api } from "@/lib/errors";
import { authorizeResource } from "@/lib/record-access";
import { db } from "@/lib/db";
export async function GET(req: Request) {
  return api(async () => {
    await authorizeResource("comparisons");
    const p = new URL(req.url).searchParams;
    const where = {
      ...(p.get("tenderId") ? { tenderId: p.get("tenderId")! } : {}),
      ...(p.get("rfqId") ? { rfqId: p.get("rfqId")! } : {}),
    };
    const rows = await db.commercialComparison.findMany({
      where,
      include: {
        quote: {
          include: {
            series: { include: { manufacturer: { select: { name: true } } } },
          },
        },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return Response.json({
      rows,
      total: await db.commercialComparison.count({ where }),
      limit: 100,
    });
  });
}
