import { z } from "zod";
import path from "node:path";
import { api, AppError, json } from "@/lib/errors";
import { authorize, csrf, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { retrieve, store, removeStored } from "@/lib/storage";
import { packageFiles } from "@/lib/documents";
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    csrf(req);
    const user = await authorize("tenders", true);
    if (!can(user, "generated", true))
      throw new AppError(403, "Document generation permission required");
    const { companyDocumentIds } = z
      .object({ companyDocumentIds: z.array(z.string()).max(100).default([]) })
      .strict()
      .parse(await json(req));
    if (companyDocumentIds.length && !can(user, "documents"))
      throw new AppError(403, "Company document access required");
    const { id } = await ctx.params;
    const tender = await db.tender.findUnique({
      where: { id },
      include: {
        files: { where: { generated: null } },
        requirements: { include: { files: true } },
      },
    });
    if (!tender) throw new AppError(404, "Tender not found");
    const history = await db.generatedDocument.findMany({
      where: { tenderId: id, format: { not: "ZIP" } },
      include: { file: true },
      orderBy: { createdAt: "desc" },
    });
    const seen = new Set<string>();
    const drafts = history.filter((g) => {
      const key = g.templateId + ":" + g.format;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (!drafts.length || drafts.some((g) => !g.reviewedAt))
      throw new AppError(
        400,
        "Generate and review all individual drafts before packaging",
      );
    const documents = await db.companyDocument.findMany({
      where: { id: { in: companyDocumentIds }, active: true },
      include: { files: { orderBy: { createdAt: "desc" } } },
    });
    if (documents.length !== new Set(companyDocumentIds).size)
      throw new AppError(400, "Choose active company documents");
    const sources = [
      ...tender.files,
      ...tender.requirements.flatMap((r) => r.files),
      ...documents.flatMap((d) => {
        const names = new Set<string>();
        return d.files.filter((f) => {
          if (names.has(f.name)) return false;
          names.add(f.name);
          return true;
        });
      }),
    ];
    // Keep a bounded in-memory package; no persistent application filesystem.
    const all = [
      ...drafts.map((g) => ({ file: g.file, folder: "reviewed-drafts" })),
      ...sources.map((file) => ({ file, folder: "source-evidence" })),
    ];
    if (all.reduce((s, v) => s + v.file.size, 0) > 32 * 1024 * 1024)
      throw new AppError(
        413,
        "Split packages larger than 32 MB into smaller sets",
      );
    const files = [];
    for (const { file, folder } of all)
      files.push({
        name: `${folder}/${file.id}-${path.basename(file.name)}`,
        bytes: await retrieve(file.key),
      });
    files.push({
      name: "REVIEW-NOTES.txt",
      bytes: Buffer.from(
        "Employee-reviewed tender drafts and selected source evidence. Confirm portal-specific requirements before submission.\nTender: " +
          tender.number,
      ),
    });
    const bytes = await packageFiles(files),
      saved = await store(bytes, "application/zip", ".zip");
    try {
      const record = await db.$transaction(async (tx) => {
        const f = await tx.storedFile.create({
          data: {
            ...saved,
            name: `${tender.number.replace(/[^a-zA-Z0-9_-]/g, "_")}-bid-package.zip`,
            mime: "application/zip",
            size: bytes.length,
            module: "tenders",
            recordId: id,
            tenderId: id,
          },
        });
        const g = await tx.generatedDocument.create({
          data: {
            tenderId: id,
            sourceModule: "tenders",
            sourceId: id,
            format: "ZIP",
            snapshot: {
              draftIds: drafts.map((d) => d.id),
              sourceFileIds: sources.map((f) => f.id),
            },
            fileId: f.id,
          },
        });
        await tx.tender.update({
          where: { id },
          data: { reviewedAt: null, reviewedBy: null },
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "PACKAGE_BID",
            module: "tenders",
            recordId: id,
          },
        });
        return g;
      });
      return Response.json(
        { id: record.id, fileId: record.fileId },
        { status: 201 },
      );
    } catch (error) {
      await removeStored(saved.key).catch(() => {});
      throw error;
    }
  });
}
