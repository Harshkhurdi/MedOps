import { z } from "zod";
import { calendarDate } from "../date-schema";
const text = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(v),
    "Use plain text",
  );
const url = z
  .url()
  .max(2500)
  .refine((v) => {
    const u = new URL(v);
    return (
      ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
    );
  }, "Use a public source URL");
const date = calendarDate.transform((v) => v.toISOString());
export const sourceItem = z
  .object({
    id: text,
    equipment: text,
    quantity: z.number().int().min(1).max(1000000).nullable(),
    quantityText: text.optional(),
    category: text.optional(),
    sourceUrl: url.optional(),
    sourceLabel: text.optional(),
    sourcePage: z.number().int().positive().optional(),
    sourceSheet: text.optional(),
    sourceRow: z.number().int().positive().optional(),
  })
  .strict();
export const trackerTender = z
  .object({
    externalTenderId: text,
    sourceUrl: url,
    sourceName: text,
    number: text.optional(),
    bidNumber: text.optional(),
    title: text,
    institution: text.optional(),
    state: text.optional(),
    category: text.optional(),
    description: z
      .string()
      .max(10000)
      .refine((v) => !/[<>\u0000]/.test(v), "Use plain text")
      .optional(),
    publicationDate: date.optional(),
    deadline: date.optional(),
    estimatedValue: z
      .string()
      .regex(/^\d{1,12}(\.\d{1,2})?$/)
      .optional(),
    discoveredAt: date,
    sourceUpdatedAt: date.optional(),
    items: z.array(sourceItem).max(100),
    documents: z.array(z.object({ label: text, url }).strict()).max(100),
    revisions: z
      .array(
        z
          .object({
            title: text.optional(),
            url: url.optional(),
            publishedDate: date.optional(),
            revisedClosingDate: date.optional(),
          })
          .strict(),
      )
      .max(100),
    references: z.array(z.object({ label: text, url }).strict()).max(100),
  })
  .strict();
export const trackerImport = z
  .object({
    grant: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    tender: trackerTender,
    selectedItemIds: z.array(text).max(100),
  })
  .strict()
  .superRefine((v, ctx) => {
    const ids = v.tender.items.map((i) => i.id);
    if (
      new Set(ids).size !== ids.length ||
      new Set(v.selectedItemIds).size !== v.selectedItemIds.length ||
      v.selectedItemIds.some((id) => !ids.includes(id))
    )
      ctx.addIssue({ code: "custom", message: "Select distinct source items" });
  });
export type TrackerTender = z.infer<typeof trackerTender>;
