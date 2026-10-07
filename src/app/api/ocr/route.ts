import { z } from "zod";
import { api, json, AppError } from "@/lib/errors";
import { authorize, csrf, audit } from "@/lib/auth";
import { authorizeResource, canResource } from "@/lib/record-access";
import { ocrConfiguration, privateOcr } from "@/lib/ocr";
import { db } from "@/lib/db";
import { retrieve } from "@/lib/storage";
export const maxDuration = 60;
export async function GET(req: Request) {
  return api(async () => {
    const u = await authorize("ocr"),
      name = new URL(req.url).searchParams.get("module") ?? "documents";
    if (!canResource(u, name))
      throw new AppError(403, "Document module access required");
    return Response.json({
      ...ocrConfiguration(),
      files: await db.storedFile.findMany({
        where: {
          module: name,
          mime: { in: ["application/pdf", "image/png", "image/jpeg"] },
        },
        select: { id: true, name: true, mime: true, version: true },
        take: 100,
        orderBy: { createdAt: "desc" },
      }),
    });
  });
}
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const u = await authorize("ocr", true),
      { fileId } = z
        .object({ fileId: z.string().min(1), confirmed: z.literal(true) })
        .strict()
        .parse(await json(req));
    const file = await db.storedFile.findUnique({ where: { id: fileId } });
    if (!file) throw new AppError(404, "File not found");
    await authorizeResource(file.module, true);
    const output = await privateOcr(await retrieve(file.key), file.mime);
    await audit(u.id, "PRIVATE_OCR", file.module, file.recordId, {
      fileId: file.id,
    });
    return Response.json(output);
  });
}
