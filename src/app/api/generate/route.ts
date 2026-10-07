import { z } from "zod";
import { api, AppError, json } from "@/lib/errors";
import { authorize, csrf, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { store, removeStored } from "@/lib/storage";
import { generateFiles, packageFiles } from "@/lib/documents";
import { money } from "@/lib/business";
import { invoiceLedger } from "@/lib/revenue";
const input = z
  .object({
    templateId: z.string(),
    sourceModule: z.enum([
      "rfqs",
      "ticket-visits",
      "tenders",
      "deliveries",
      "installations",
      "invoices",
    ]),
    sourceId: z.string(),
    values: z.record(z.string(), z.string().max(10000)),
    format: z.enum(["DOCX", "PDF", "XLSX", "ZIP"]),
    preview: z.boolean().default(false),
  })
  .strict();
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const user = await authorize("generated", true);
    const data = input.parse(await json(req));
    if (!can(user, data.sourceModule))
      throw new AppError(403, "Source record access is required");
    const company = await db.companyProfile.findFirst(),
      template = await db.documentTemplate.findUnique({
        where: { id: data.templateId },
      });
    if (!company) throw new AppError(400, "Save the company profile first");
    if (!template?.approved)
      throw new AppError(400, "Select an administrator-approved template");
    const allowed: Record<string, string[]> = {
      rfqs: ["RFQ_LETTER", "CUSTOM"],
      tenders: [
        "COVERING_LETTER",
        "NON_BLACKLISTING",
        "WARRANTY_UNDERTAKING",
        "AUTHORIZATION_REQUEST",
        "COMPLIANCE_STATEMENT",
        "COMPLIANCE_COMPARISON",
        "CHECKLIST",
        "CUSTOM",
      ],
      deliveries: ["DELIVERY_CHALLAN", "PACKING_LIST", "CUSTOM"],
      installations: [
        "INSTALLATION_REPORT",
        "COMMISSIONING_REPORT",
        "HANDOVER",
        "CUSTOM",
      ],
      invoices: ["PAYMENT_REMINDER", "CUSTOM"],
      "ticket-visits": ["SERVICE_REPORT", "CUSTOM"],
    };
    if (!allowed[data.sourceModule].includes(template.kind))
      throw new AppError(400, "Template does not match the source module");
    let defaults: Record<string, string> = {
      company_name: company.legalName,
      company_address: company.address,
      authorized_signatory: company.signatory ?? "",
      declaration_text: company.declarations,
    };
    let rows: {
        requirement: string;
        specification: string;
        compliance: string;
        evidenceNotes?: string | null;
      }[] = [],
      tenderId: string | undefined;
    if (data.sourceModule === "rfqs") {
      const r = await db.rfq.findUnique({
        where: { id: data.sourceId },
        include: { manufacturer: true, customer: true, contact: true },
      });
      if (!r) throw new AppError(404, "RFQ not found");
      defaults = {
        ...defaults,
        rfq_number: r.number,
        manufacturer_name: r.manufacturer.name,
        contact_name: r.contact?.name ?? "",
        hospital_name: r.customer?.name ?? "",
        equipment_name: r.productName,
        model_number: r.model ?? "",
        quantity: String(r.quantity),
        accessories: r.accessories ?? "",
        warranty_period: r.warrantyRequirement ?? "",
        delivery_location: r.deliveryLocation ?? "",
        delivery_time: r.requiredDeliveryTime ?? "",
        quote_required_by: r.quoteRequiredBy?.toISOString().slice(0, 10) ?? "",
        report_notes: r.notes ?? "",
      };
    }
    if (data.sourceModule === "tenders") {
      const t = await db.tender.findUnique({
        where: { id: data.sourceId },
        include: {
          customer: true,
          items: { include: { manufacturer: true } },
          requirements: true,
        },
      });
      if (!t) throw new AppError(404, "Tender not found");
      tenderId = t.id;
      rows = t.requirements;
      defaults = {
        ...defaults,
        tender_number: t.number,
        hospital_name: t.customer?.name ?? "",
        equipment_name: t.items.map((i) => i.equipment).join(", "),
        manufacturer_name: t.items
          .map((i) => i.manufacturer?.name ?? "")
          .join(", "),
        model_number: t.items.map((i) => i.model ?? "").join(", "),
        quantity: t.items.map((i) => String(i.quantity)).join(", "),
        warranty_period: t.warrantyTerms ?? "",
      };
    }
    if (data.sourceModule === "deliveries") {
      const d = await db.delivery.findUnique({
        where: { id: data.sourceId },
        include: {
          order: { include: { customer: true } },
          items: { include: { orderItem: true } },
          equipment: true,
        },
      });
      if (!d) throw new AppError(404, "Delivery not found");
      defaults = {
        ...defaults,
        po_number: d.order.number,
        hospital_name: d.order.customer.name,
        delivery_location: d.location,
        tracking_number: d.tracking ?? "",
        items_text: d.items
          .map((i) => `${i.orderItem.equipment}: ${i.quantity}`)
          .join("\n"),
        serial_numbers: d.equipment.map((e) => e.serialNumber).join(", "),
      };
    }
    if (data.sourceModule === "installations") {
      const i = await db.installation.findUnique({
        where: { id: data.sourceId },
        include: {
          equipment: { include: { customer: true, orderItem: true } },
        },
      });
      if (!i) throw new AppError(404, "Installation not found");
      defaults = {
        ...defaults,
        hospital_name: i.equipment.customer.name,
        equipment_name:
          i.equipment.orderItem?.equipment ?? i.equipment.productName ?? "",
        serial_numbers: i.equipment.serialNumber,
        installation_date: i.installationDate?.toISOString().slice(0, 10) ?? "",
        commissioning_date:
          i.commissioningDate?.toISOString().slice(0, 10) ?? "",
        acceptance_date: i.acceptanceDate?.toISOString().slice(0, 10) ?? "",
        report_notes: i.notes ?? "",
      };
    }
    if (data.sourceModule === "invoices") {
      const i = await db.invoice.findUnique({
        where: { id: data.sourceId },
        include: { customer: true, payments: true, adjustments: true },
      });
      if (!i) throw new AppError(404, "Invoice not found");
      defaults = {
        ...defaults,
        hospital_name: i.customer.name,
        invoice_number: i.number,
        invoice_total: money(
          invoiceLedger(i.total, i.payments, i.adjustments).charged,
        ),
        outstanding_amount: money(
          invoiceLedger(i.total, i.payments, i.adjustments).outstanding,
        ),
        due_date: i.dueDate.toISOString().slice(0, 10),
      };
    }
    if (data.sourceModule === "ticket-visits") {
      const v = await db.ticketVisit.findUnique({
        where: { id: data.sourceId },
        include: { ticket: { include: { customer: true } } },
      });
      if (!v) throw new AppError(404, "Service visit not found");
      defaults = {
        ...defaults,
        hospital_name: v.ticket.customer.name,
        ticket_number: v.ticket.number,
        equipment_name: v.ticket.productName,
        serial_number: v.ticket.serialNumber ?? "",
        reported_issue: v.ticket.issue,
        work_done: v.workDone ?? "",
        visit_date: (v.startedAt ?? v.scheduledAt).toISOString(),
        representative: v.representative ?? "",
        acknowledgement: v.acknowledgement ?? "",
        report_notes: v.notes ?? "",
      };
    }
    const values = { ...defaults, ...data.values };
    if (data.preview)
      return Response.json({
        values,
        body: template.body,
        preview: template.body.replace(
          /{{\s*(\w+)\s*}}/g,
          (_, k: string) => values[k] || `[Complete ${k}]`,
        ),
        compliance: rows,
      });
    const files = await generateFiles(
      template.body,
      values,
      rows,
      data.format === "PDF" || data.format === "ZIP",
    );
    const ext = data.format.toLowerCase();
    const bytes =
      data.format === "ZIP"
        ? await packageFiles([
            { name: "draft.docx", bytes: files.docx },
            { name: "draft.pdf", bytes: files.pdf },
            { name: "compliance.xlsx", bytes: files.xlsx },
          ])
        : data.format === "DOCX"
          ? files.docx
          : data.format === "PDF"
            ? files.pdf
            : files.xlsx;
    const types = {
      DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      PDF: "application/pdf",
      XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ZIP: "application/zip",
    };
    const saved = await store(bytes, types[data.format], "." + ext);
    try {
      const generated = await db.$transaction(async (tx) => {
        const file = await tx.storedFile.create({
          data: {
            ...saved,
            name: template.name + "." + ext,
            mime: types[data.format],
            size: bytes.length,
            module: data.sourceModule,
            recordId: data.sourceId,
            ...(tenderId ? { tenderId } : {}),
          },
        });
        const g = await tx.generatedDocument.create({
          data: {
            tenderId,
            templateId: template.id,
            sourceModule: data.sourceModule,
            sourceId: data.sourceId,
            format: data.format,
            snapshot: {
              values,
              templateBody: template.body,
              templateVersion: template.version,
              compliance: rows,
            },
            fileId: file.id,
          },
        });
        if (tenderId)
          await tx.tender.update({
            where: { id: tenderId },
            data: { reviewedAt: null, reviewedBy: null },
          });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "GENERATE_DRAFT",
            module: "generated",
            recordId: g.id,
          },
        });
        return g;
      });
      return Response.json(
        { id: generated.id, fileId: generated.fileId, preview: files.rendered },
        { status: 201 },
      );
    } catch (error) {
      await removeStored(saved.key).catch(() => {});
      throw error;
    }
  });
}
