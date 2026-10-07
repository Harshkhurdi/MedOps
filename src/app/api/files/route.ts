import { authorizeResource } from "@/lib/record-access";
import path from "node:path";
import { z } from "zod";
import { api, AppError } from "@/lib/errors";
import { csrf } from "@/lib/auth";
import { db } from "@/lib/db";
import { collection, delegate } from "@/lib/resources";
import {
  store,
  removeStored,
  MAX_UPLOAD,
  validateUpload,
  validateOfficeArchive,
  limitedFormData,
} from "@/lib/storage";
const links: Record<string, string> = {
  securities: "securityId",
  rfqs: "rfqId",
  quotes: "quotationId",
  documents: "companyDocumentId",
  tenders: "tenderId",
  requirements: "requirementId",
  orders: "orderId",
  deliveries: "deliveryId",
  warranties: "warrantyId",
  amcs: "amcId",
  invoices: "invoiceId",
  visits: "serviceVisitId",
};
export async function GET(req: Request) {
  return api(async () => {
    const p = new URL(req.url).searchParams;
    const resource = collection(p.get("module") ?? ""),
      recordId = p.get("recordId") ?? "";
    await authorizeResource(resource);
    return Response.json(
      await db.storedFile.findMany({
        where: { module: resource, recordId },
        select: {
          id: true,
          name: true,
          mime: true,
          size: true,
          version: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    );
  });
}
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    if (Number(req.headers.get("content-length")) > MAX_UPLOAD + 10000)
      throw new AppError(413, "File limit is 4 MB");
    const form = await limitedFormData(req);
    const resource = collection(z.string().parse(form.get("module"))),
      recordId = z.string().min(1).parse(form.get("recordId"));
    const user = await authorizeResource(resource, true);
    if (!links[resource])
      throw new AppError(400, "Files cannot be attached to this resource");
    const parent = await delegate(resource).findUnique({
      where: { id: recordId },
    });
    if (!parent) throw new AppError(404, "Linked record not found");
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError(400, "Choose a file");
    if (file.size > MAX_UPLOAD) throw new AppError(413, "File limit is 4 MB");
    const bytes = Buffer.from(await file.arrayBuffer());
    validateUpload(file.name, file.type, bytes);
    await validateOfficeArchive(file.name, bytes);
    const saved = await store(
      bytes,
      file.type,
      path.extname(file.name).toLowerCase(),
    );
    try {
      const metadata = await db.$transaction(
        async (tx) => {
          const previous = await tx.storedFile.findFirst({
            where: { module: resource, recordId, name: file.name },
            orderBy: { version: "desc" },
          });
          const record = await tx.storedFile.create({
            data: {
              ...saved,
              name: path.basename(file.name).slice(0, 200),
              mime: file.type,
              size: file.size,
              module: resource,
              recordId,
              version: (previous?.version ?? 0) + 1,
              [links[resource]]: recordId,
            },
          });
          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: previous ? "REPLACE_FILE" : "UPLOAD_FILE",
              module: resource,
              recordId,
              details: { fileId: record.id },
            },
          });
          if (resource === "tenders" || resource === "requirements") {
            const tenderId =
              resource === "tenders" ? recordId : String(parent.tenderId);
            await tx.tender.update({
              where: { id: tenderId },
              data: { reviewedAt: null, reviewedBy: null },
            });
            await tx.generatedDocument.updateMany({
              where: { tenderId },
              data: { reviewedAt: null, reviewedBy: null },
            });
          }
          return record;
        },
        { isolationLevel: "Serializable" },
      );
      return Response.json(
        { id: metadata.id, name: metadata.name, version: metadata.version },
        { status: 201 },
      );
    } catch (error) {
      await removeStored(saved.key).catch(() => {});
      throw error;
    }
  });
}
