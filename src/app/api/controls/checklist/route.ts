import { z } from "zod";
import { api, json, AppError } from "@/lib/errors";
import { csrf } from "@/lib/auth";
import { authorizeResource } from "@/lib/record-access";
import { db } from "@/lib/db";
const items: Record<string, string[]> = {
  COMMERCIAL: [
    "Price finalized",
    "Manufacturer quotation approved",
    "Taxes confirmed",
    "EMD completed",
  ],
  TECHNICAL: [
    "Product selected",
    "Technical compliance reviewed",
    "Datasheet attached",
    "Supporting evidence attached",
  ],
  MANUFACTURER: [
    "Authorization received",
    "Quotation received",
    "Warranty commitment confirmed",
  ],
  COMPANY_DOCUMENTATION: [
    "GST",
    "PAN",
    "Registration",
    "Declarations",
    "Experience certificates",
    "Other documents",
  ],
  SUBMISSION: [
    "Package reviewed",
    "Documents signed",
    "Portal submission complete",
    "Submission acknowledgement saved",
  ],
};
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const user = await authorizeResource("checklist", true),
      input = z
        .object({ tenderId: z.string().min(1) })
        .strict()
        .parse(await json(req));
    if (!(await db.tender.findUnique({ where: { id: input.tenderId } })))
      throw new AppError(404, "Tender not found");
    const result = await db.$transaction(async (tx) => {
      const added = await tx.bidChecklist.createMany({
        data: Object.entries(items).flatMap(([section, titles]) =>
          titles.map((title) => ({
            tenderId: input.tenderId,
            section,
            title,
            status: "PENDING",
          })),
        ),
        skipDuplicates: true,
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "ADD_CHECKLIST",
          module: "checklist",
          recordId: input.tenderId,
          details: { added: added.count },
        },
      });
      return added;
    });
    return Response.json(result);
  });
}
