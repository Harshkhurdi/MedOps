import { z } from "zod";
import { api, AppError, json } from "@/lib/errors";
import { authorize, csrf } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    csrf(req);
    const user = await authorize("warranties", true);
    const { note } = z
      .object({ note: z.string().trim().min(1).max(4000) })
      .strict()
      .parse(await json(req));
    const { id } = await ctx.params;
    await db.$transaction(
      async (tx) => {
        const w = await tx.warranty.findUnique({ where: { id } });
        if (!w) throw new AppError(404, "Warranty not found");
        const notes =
          (w.notes ?? "") +
          "\n" +
          new Date().toISOString().slice(0, 10) +
          " · " +
          user.name +
          ": " +
          note;
        if (notes.length > 50000)
          throw new AppError(
            413,
            "Archive this service history before adding more notes",
          );
        await tx.warranty.update({ where: { id }, data: { notes } });
        await tx.warrantyHistory.create({
          data: { warrantyId: id, changedBy: user.id, snapshot: { note } },
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "ADD_SERVICE_NOTE",
            module: "warranties",
            recordId: id,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    return Response.json({ ok: true });
  });
}
