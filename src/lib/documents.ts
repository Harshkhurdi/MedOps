import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
} from "docx";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import { renderTemplate } from "./business";
import { AppError } from "./errors";
export const standardTemplates: Record<string, { name: string; body: string }> =
  {
    RFQ_LETTER: {
      name: "Request for quotation",
      body: "To: {{manufacturer_name}}\nSubject: RFQ {{rfq_number}}\n\nPlease provide your quotation for {{equipment_name}}, model {{model_number}}, quantity {{quantity}}.\nWarranty requirement: {{warranty_period}}\nDelivery location: {{delivery_location}}\nQuote required by: {{quote_required_by}}\n\n{{company_name}}\n{{authorized_signatory}}",
    },
    COVERING_LETTER: {
      name: "Tender covering letter",
      body: "To: {{hospital_name}}\nSubject: Tender {{tender_number}}\n\nWe, {{company_name}}, submit our reviewed bid for {{equipment_name}}, model {{model_number}}, quantity {{quantity}}.\nPlease refer to the enclosed approved supporting documents.\n\n{{authorized_signatory}}\n{{company_address}}",
    },
    NON_BLACKLISTING: {
      name: "Non-blacklisting declaration",
      body: "Tender: {{tender_number}}\n\n{{company_name}} declares: {{declaration_text}}\n\nThis declaration must be verified and approved by the authorized signatory before submission.\n{{authorized_signatory}}",
    },
    WARRANTY_UNDERTAKING: {
      name: "Warranty undertaking",
      body: "Tender: {{tender_number}}\nCustomer: {{hospital_name}}\nEquipment: {{equipment_name}}\n\n{{company_name}} undertakes the following confirmed warranty terms: {{warranty_period}}\n\n{{authorized_signatory}}",
    },
    AUTHORIZATION_REQUEST: {
      name: "Manufacturer authorization request",
      body: "To: {{manufacturer_name}}\nSubject: Authorization request for {{tender_number}}\n\nPlease consider issuing an official authorization to {{company_name}} for {{equipment_name}}, model {{model_number}}, for {{hospital_name}}.\nThis request is not a manufacturer authorization certificate.\n\n{{authorized_signatory}}",
    },
    COMPLIANCE_STATEMENT: {
      name: "Technical compliance statement",
      body: "Tender {{tender_number}}\nEquipment: {{equipment_name}}\nManufacturer: {{manufacturer_name}}\nModel: {{model_number}}\n\nPlease refer to the attached employee-reviewed comparison table and source evidence.\nNo compliance has been assumed automatically.\n{{authorized_signatory}}",
    },
    COMPLIANCE_COMPARISON: {
      name: "Technical compliance comparison",
      body: "Tender {{tender_number}}\nTechnical requirements and corresponding verified manufacturer specifications are listed below.",
    },
    CHECKLIST: {
      name: "Tender checklist",
      body: "Tender {{tender_number}}\nRequired documents and status (employee confirmed):\n{{checklist_text}}",
    },
    DELIVERY_CHALLAN: {
      name: "Delivery challan draft",
      body: "Purchase order {{po_number}}\nCustomer: {{hospital_name}}\nDelivery location: {{delivery_location}}\nEquipment and quantities: {{items_text}}\nReference: {{tracking_number}}\n{{company_name}}\n{{authorized_signatory}}",
    },
    PACKING_LIST: {
      name: "Packing list draft",
      body: "Purchase order {{po_number}}\nEquipment and quantities: {{items_text}}\nSerial numbers: {{serial_numbers}}\n{{company_name}}",
    },
    INSTALLATION_REPORT: {
      name: "Installation report draft",
      body: "Customer: {{hospital_name}}\nEquipment: {{equipment_name}}\nSerial: {{serial_numbers}}\nInstallation date: {{installation_date}}\nConfirmed observations: {{report_notes}}\n{{authorized_signatory}}",
    },
    COMMISSIONING_REPORT: {
      name: "Commissioning report draft",
      body: "Customer: {{hospital_name}}\nSerial: {{serial_numbers}}\nCommissioning date: {{commissioning_date}}\nConfirmed observations: {{report_notes}}\n{{authorized_signatory}}",
    },
    HANDOVER: {
      name: "Equipment handover draft",
      body: "Customer: {{hospital_name}}\nSerial: {{serial_numbers}}\nAcceptance date: {{acceptance_date}}\nConfirmed handover details: {{report_notes}}\n{{authorized_signatory}}",
    },
    PAYMENT_REMINDER: {
      name: "Payment reminder letter",
      body: "To: {{hospital_name}}\nSubject: Invoice {{invoice_number}}\n\nInvoice total: INR {{invoice_total}}\nOutstanding: INR {{outstanding_amount}}\nDue date: {{due_date}}\nPlease arrange payment or share the payment reference.\n{{company_name}}\n{{authorized_signatory}}",
    },
  };
export type ComplianceRow = {
  requirement: string;
  specification: string;
  compliance: string;
  evidenceNotes?: string | null;
};
export async function generateFiles(
  body: string,
  values: Record<string, string>,
  rows: ComplianceRow[] = [],
  includePdf = true,
) {
  const rendered =
    "DRAFT — REQUIRES EMPLOYEE REVIEW\n\n" + renderTemplate(body, values);
  const paragraphs = rendered
    .split("\n")
    .map((line) => new Paragraph({ children: [new TextRun(line)] }));
  const table = rows.length
    ? new Table({
        rows: [
          [
            "Requirement",
            "Manufacturer specification",
            "Compliance",
            "Evidence",
          ],
          ...rows.map((r) => [
            r.requirement,
            r.specification,
            r.compliance,
            r.evidenceNotes ?? "",
          ]),
        ].map(
          (cells) =>
            new TableRow({
              children: cells.map(
                (text) => new TableCell({ children: [new Paragraph(text)] }),
              ),
            }),
        ),
      })
    : null;
  const docx = await Packer.toBuffer(
    new Document({
      sections: [{ children: [...paragraphs, ...(table ? [table] : [])] }],
    }),
  );
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Compliance");
  sheet.columns = [
    { header: "Tender requirement", key: "requirement", width: 45 },
    { header: "Manufacturer specification", key: "specification", width: 45 },
    { header: "Compliance - employee decision", key: "compliance", width: 32 },
    { header: "Evidence", key: "evidenceNotes", width: 45 },
  ];
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.eachRow((r) => (r.alignment = { wrapText: true, vertical: "top" }));
  const xlsx = Buffer.from(await workbook.xlsx.writeBuffer());
  const pdf = await PDFDocument.create(),
    font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage([595, 842]),
    y = 790;
  const fullText =
    rendered +
    (rows.length
      ? "\n\n" +
        rows
          .map(
            (r) =>
              `${r.requirement}\nSpecification: ${r.specification}\nDecision: ${r.compliance}\nEvidence: ${r.evidenceNotes ?? "Not provided"}`,
          )
          .join("\n\n")
      : "");
  // PDF is rendered directly, never converted by an external service.
  if (includePdf)
    for (const line of fullText.split("\n")) {
      const words = line.replace(/—/g, "-").split(/\s+/);
      let chunk = "";
      for (const word of words) {
        try {
          font.encodeText(word);
        } catch {
          throw new AppError(
            400,
            "PDF generation currently supports Latin text. Use DOCX for this document or replace unsupported characters.",
          );
        }
        if (
          font.widthOfTextAtSize((chunk ? chunk + " " : "") + word, 10) > 490 &&
          chunk
        ) {
          draw(chunk);
          chunk = word;
        } else chunk += (chunk ? " " : "") + word;
      }
      draw(chunk);
    }
  function draw(line: string) {
    if (y < 50) {
      page = pdf.addPage([595, 842]);
      y = 790;
    }
    page.drawText(line, {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0.08, 0.13, 0.2),
    });
    y -= 15;
  }
  return { docx, pdf: Buffer.from(await pdf.save()), xlsx, rendered };
}
export async function packageFiles(files: { name: string; bytes: Buffer }[]) {
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.bytes));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
