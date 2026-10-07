import { z } from "zod";
import { api, json, AppError } from "@/lib/errors";
import { authorize, csrf } from "@/lib/auth";
import { db } from "@/lib/db";
import { confirmImport, importReport } from "@/lib/imports";
export const maxDuration = 60;
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    csrf(req);
    z.object({ confirmed: z.literal(true) })
      .strict()
      .parse(await json(req));
    return Response.json(
      await confirmImport(
        await authorize("imports", true),
        (await ctx.params).id,
      ),
    );
  });
}
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    const u = await authorize("imports"),
      id = (await ctx.params).id,
      b = await db.bulkImport.findFirst({ where: { id, ownerId: u.id } });
    if (!b) throw new AppError(404, "Import not found");
    return Response.json({
      id,
      status: b.status,
      preview: b.preview,
      ...importReport(b.report as Parameters<typeof importReport>[0]),
    });
  });
}
