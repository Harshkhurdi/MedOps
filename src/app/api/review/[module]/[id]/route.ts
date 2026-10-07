import { api, AppError } from "@/lib/errors";
import { authorize, csrf, can } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(
  req: Request,
  ctx: { params: Promise<{ module: string; id: string }> },
) {
  return api(async () => {
    csrf(req);
    const { module, id } = await ctx.params;
    if (!["tenders", "generated"].includes(module))
      throw new AppError(404, "Review unavailable");
    const user = await authorize(module, true);
    await db.$transaction(
      async (tx) => {
        if (module === "generated") {
          const g = await tx.generatedDocument.findUnique({ where: { id } });
          if (!g) throw new AppError(404, "Draft not found");
          if (!can(user, g.sourceModule))
            throw new AppError(403, "Source access required");
          await tx.generatedDocument.update({
            where: { id },
            data: { reviewedAt: new Date(), reviewedBy: user.id },
          });
        } else {
          const t = await tx.tender.findUnique({
            where: { id },
            include: { generated: true, requirements: true, files: true },
          });
          if (!t) throw new AppError(404, "Tender not found");
          if (!t.generated.length || t.generated.some((g) => !g.reviewedAt))
            throw new AppError(400, "Review all generated documents first");
          if (t.requirements.some((r) => r.compliance === "REQUIRES_REVIEW"))
            throw new AppError(400, "Review all technical requirements");
          if (!t.files.length)
            throw new AppError(
              400,
              "Attach the tender source documents before review",
            );
          await tx.tender.update({
            where: { id },
            data: { reviewedAt: new Date(), reviewedBy: user.id },
          });
        }
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "APPROVE_REVIEW",
            module,
            recordId: id,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    return Response.json({ ok: true });
  });
}
