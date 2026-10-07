import { z } from "zod";
import { db } from "../db";
import { AppError } from "../errors";
import { type Actor, can } from "../auth";
import { save } from "../service";
import { trackerTender } from "./tender-tracker-contract";
const fields = [
  "title",
  "institutionName",
  "state",
  "category",
  "deadline",
  "publicationDate",
  "description",
] as const;
export const sourceReview = z
  .object({
    versionId: z.string().min(1).max(100),
    action: z.enum(["ACCEPT", "KEEP"]),
    expectedUpdatedAt: z.iso.datetime(),
    fields: z.array(z.enum(fields)).max(7).default([]),
    items: z
      .array(
        z
          .object({
            id: z.string().min(1).max(500),
            quantity: z.number().int().min(1).max(1000000),
          })
          .strict(),
      )
      .max(100)
      .optional(),
  })
  .strict();
export async function reviewSource(
  tenderId: string,
  input: unknown,
  user: Actor,
) {
  if (!can(user, "tenders", true))
    throw new AppError(403, "Tender write permission is required");
  const data = sourceReview.parse(input);
  return db.$transaction(
    async (tx) => {
      const version = await tx.tenderSourceVersion.findUnique({
        where: { id: data.versionId },
        include: { import: true },
      });
      if (!version || version.import.tenderId !== tenderId)
        throw new AppError(404, "Source version not found");
      if (version.resolution !== "PENDING_REVIEW")
        throw new AppError(
          409,
          "This source version has already been reviewed",
        );
      const current = await tx.tender.findUnique({
        where: { id: tenderId },
        include: { items: true },
      });
      if (!current) throw new AppError(404, "Tender not found");
      if (current.updatedAt.toISOString() !== data.expectedUpdatedAt)
        throw new AppError(
          409,
          "The tender changed. Reload before reviewing the source.",
        );
      if (data.action === "ACCEPT") {
        const source = trackerTender.parse(version.snapshot);
        const keys = [
          "number",
          "gemUrl",
          "customerId",
          "bidNumber",
          "title",
          "institutionName",
          "state",
          "source",
          "sourceUrl",
          "publicationDate",
          "historical",
          "originalDate",
          "recordSource",
          "category",
          "deadline",
          "emd",
          "estimatedValue",
          "warrantyTerms",
          "deliveryTerms",
          "notes",
          "status",
        ] as const;
        const values: Record<string, unknown> = Object.fromEntries(
          keys.map((k) => [k, current[k]]),
        );
        for (const key of ["emd", "estimatedValue"])
          if (values[key] != null) values[key] = String(values[key]);
        const mapping = {
          title: source.title,
          institutionName: source.institution,
          state: source.state,
          category: source.category,
          deadline: source.deadline,
          publicationDate: source.publicationDate,
          description: source.description,
        };
        for (const key of data.fields) {
          if (mapping[key] !== undefined)
            values[key === "description" ? "notes" : key] = mapping[key];
        }
        const existing = current.items.map((i) => ({
          equipment: i.equipment,
          quantity: i.quantity,
          category: i.category,
          sourceItemId: i.sourceItemId,
          sourceUrl: i.sourceUrl,
          manufacturerId: i.manufacturerId,
          productId: i.productId,
          model: i.model,
        }));
        values.items = existing;
        if (data.items !== undefined) {
          if (new Set(data.items.map((i) => i.id)).size !== data.items.length)
            throw new AppError(400, "Select distinct source items");
          values.items = data.items.map((selected) => {
            const item = source.items.find((i) => i.id === selected.id);
            if (!item) throw new AppError(400, "Source item not found");
            const prior =
              existing.find((i) => i.sourceItemId === item.id) ??
              existing.find((i) => i.equipment === item.equipment);
            return {
              ...prior,
              equipment: item.equipment,
              quantity: selected.quantity,
              category: item.category,
              sourceItemId: item.id,
              sourceUrl: item.sourceUrl,
            };
          });
        }
        await save(
          "tenders",
          values,
          user,
          tenderId,
          data.expectedUpdatedAt,
          tx,
        );
      }
      const claimed = await tx.tenderSourceVersion.updateMany({
        where: { id: version.id, resolution: "PENDING_REVIEW" },
        data: {
          resolution: data.action === "ACCEPT" ? "ACCEPTED" : "KEPT_MEDOPS",
          resolvedBy: user.id,
          resolvedAt: new Date(),
        },
      });
      if (claimed.count !== 1)
        throw new AppError(
          409,
          "This source version has already been reviewed",
        );
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action:
            data.action === "ACCEPT"
              ? "TRACKER_SOURCE_ACCEPTED"
              : "TRACKER_SOURCE_KEPT",
          module: "tenders",
          recordId: tenderId,
          details: {
            versionId: version.id,
            externalTenderId: version.import.externalTenderId,
          },
        },
      });
      return { reviewed: true };
    },
    { isolationLevel: "Serializable", timeout: 15000 },
  );
}
