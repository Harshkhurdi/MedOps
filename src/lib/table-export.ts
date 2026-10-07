import ExcelJS from "exceljs";
import { csvCell } from "./reports";
export async function tableExport(
  rows: Record<string, unknown>[],
  columns: string[],
  format: string,
  name: string,
) {
  const values = rows.map((r) =>
    columns.map((k) => (r[k] == null ? "" : String(r[k]))),
  );
  let bytes: Buffer;
  if (format === "csv")
    bytes = Buffer.from(
      "\uFEFF" +
        [columns, ...values].map((r) => r.map(csvCell).join(",")).join("\r\n"),
    );
  else {
    const b = new ExcelJS.Workbook(),
      s = b.addWorksheet("Report");
    s.addRow(columns);
    values.forEach((r) => s.addRow(r));
    s.getRow(1).font = { bold: true };
    s.views = [{ state: "frozen", ySplit: 1 }];
    s.columns.forEach((c) => (c.width = 25));
    bytes = Buffer.from(await b.xlsx.writeBuffer());
  }
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type":
        format === "csv"
          ? "text/csv; charset=utf-8"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="medops-${name}.${format}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
