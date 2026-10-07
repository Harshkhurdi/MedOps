import { authorize, csrf } from "@/lib/auth";
import { db } from "@/lib/db";
import { api, AppError, json } from "@/lib/errors";
import { reviewSource } from "@/lib/integrations/tender-source-review";
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    await authorize("tenders");
    const { id } = await ctx.params;
    const tender = await db.tender.findUnique({
      where: { id },
      select: { updatedAt: true },
    });
    if (!tender) throw new AppError(404, "Tender not found");
    const imports = await db.externalTenderImport.findMany({
      where: { tenderId: id },
      include: { versions: { orderBy: { receivedAt: "desc" }, take: 100 } },
    });
    return Response.json({ updatedAt: tender.updatedAt, imports });
  });
}
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    csrf(req);
    const user = await authorize("tenders", true);
    const { id } = await ctx.params;
    return Response.json(await reviewSource(id, await json(req), user));
  });
}
