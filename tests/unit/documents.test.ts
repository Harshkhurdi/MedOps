import { it, expect } from "vitest";
import JSZip from "jszip";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { generateFiles, packageFiles } from "@/lib/documents";
it("generates real DOCX, PDF, XLSX and complete ZIP contents", async () => {
  const files = await generateFiles(
    "Tender {{tender_number}} — {{company_name}}",
    { tender_number: "TEST-001", company_name: "Synthetic Co" },
    [
      {
        requirement: "Flow >= 10",
        specification: "Source datasheet: 12",
        compliance: "REQUIRES_REVIEW",
        evidenceNotes: "Test source",
      },
    ],
  );
  const docx = await JSZip.loadAsync(files.docx);
  const xml = await docx.file("word/document.xml")!.async("string");
  expect(xml).toContain("TEST-001");
  expect(xml).toContain("REQUIRES_REVIEW");
  expect((await PDFDocument.load(files.pdf)).getPageCount()).toBeGreaterThan(0);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(new Uint8Array(files.xlsx).buffer);
  expect(workbook.getWorksheet("Compliance")!.getRow(2).getCell(3).value).toBe(
    "REQUIRES_REVIEW",
  );
  const zip = await JSZip.loadAsync(
    await packageFiles([
      { name: "draft.docx", bytes: files.docx },
      { name: "draft.pdf", bytes: files.pdf },
      { name: "compliance.xlsx", bytes: files.xlsx },
    ]),
  );
  expect(Object.keys(zip.files)).toEqual([
    "draft.docx",
    "draft.pdf",
    "compliance.xlsx",
  ]);
});
it("supports Unicode in DOCX and reports unsupported native PDF characters", async () => {
  const files = await generateFiles("{{name}}", { name: "भारत" }, [], false);
  expect(files.docx.length).toBeGreaterThan(1000);
  await expect(generateFiles("{{name}}", { name: "भारत" })).rejects.toThrow(
    "Latin",
  );
});
