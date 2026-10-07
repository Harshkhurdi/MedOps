import ExcelJS from "exceljs";
import { AppError } from "./errors";
import { validateOfficeArchive, MAX_UPLOAD } from "./storage";
export const IMPORT_LIMIT = 100;
export function parseCsv(text: string) {
  const rows: string[][] = [],
    row: string[] = [];
  let cell = "",
    quoted = false,
    closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
    } else if (c === '"' && !cell && !closed) quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
      closed = false;
    } else if (c === "\r" || c === "\n") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x !== "")) rows.push([...row]);
      row.length = 0;
      cell = "";
      closed = false;
    } else {
      if (closed && !/\s/.test(c))
        throw new AppError(400, "Malformed CSV quoting");
      cell += c;
    }
    if (
      cell.length > 10000 ||
      row.length > 60 ||
      rows.length > IMPORT_LIMIT + 1
    )
      throw new AppError(
        413,
        "Imports support 100 rows, 60 columns and 10,000 characters per cell",
      );
  }
  if (quoted) throw new AppError(400, "CSV has an unclosed quoted cell");
  row.push(cell);
  if (row.some((x) => x !== "")) rows.push([...row]);
  return rows;
}
export async function readImportFile(name: string, bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_UPLOAD)
    throw new AppError(413, "Import file limit is 4 MB");
  let matrix: string[][];
  if (name.toLowerCase().endsWith(".csv")) {
    if (bytes.includes(0)) throw new AppError(400, "Use a UTF-8 CSV");
    matrix = parseCsv(bytes.toString("utf8").replace(/^\uFEFF/, ""));
  } else if (name.toLowerCase().endsWith(".xlsx")) {
    await validateOfficeArchive(name, bytes);
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(
      bytes as unknown as Parameters<typeof book.xlsx.load>[0],
    );
    const sheet = book.worksheets[0];
    if (!sheet || book.worksheets.length !== 1)
      throw new AppError(400, "Upload a workbook with one data sheet");
    if (sheet.rowCount > IMPORT_LIMIT + 1 || sheet.columnCount > 60)
      throw new AppError(413, "Import supports 100 data rows and 60 columns");
    matrix = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values: string[] = [];
      for (let i = 1; i <= sheet.columnCount; i++) {
        const cell = row.getCell(i);
        if (
          cell.type === ExcelJS.ValueType.Formula ||
          cell.type === ExcelJS.ValueType.Hyperlink ||
          cell.type === ExcelJS.ValueType.Error
        )
          throw new AppError(
            400,
            "Formulas, hyperlinks and error cells cannot be imported. Paste plain values first.",
          );
        const value =
          cell.value instanceof Date ? cell.value.toISOString() : cell.text;
        if (value.length > 10000)
          throw new AppError(413, "Import cell too long");
        values.push(value);
      }
      matrix.push(values);
    });
  } else throw new AppError(400, "Use CSV or XLSX");
  const headers = matrix.shift()?.map((s) => s.trim()) ?? [];
  if (
    !headers.length ||
    headers.some((h) => !h) ||
    new Set(headers).size !== headers.length
  )
    throw new AppError(400, "Use unique non-empty column headings");
  if (matrix.length > IMPORT_LIMIT || !matrix.length)
    throw new AppError(400, "Include 1–100 data rows");
  if (matrix.some((r) => r.length !== headers.length))
    throw new AppError(
      400,
      "Each row must have the same number of columns as the heading",
    );
  if (JSON.stringify(matrix).length > 180000)
    throw new AppError(413, "Split this import into smaller files");
  return { headers, rows: matrix };
}
