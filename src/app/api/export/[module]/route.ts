import { authorizeResource } from "@/lib/record-access";
import ExcelJS from "exceljs";
import { api, AppError } from "@/lib/errors";
import { audit } from "@/lib/auth";
import { collection, delegate, resources } from "@/lib/resources";
import { recordWhere, safeRecord } from "@/lib/record-query";
import { configs, label } from "@/lib/ui-config";
import { csvCell } from "@/lib/reports";
export const runtime = "nodejs";
export async function GET(
  req: Request,
  ctx: { params: Promise<{ module: string }> },
) {
  return api(async () => {
    const name = collection((await ctx.params).module),
      user = await authorizeResource(name),
      params = new URL(req.url).searchParams;
    const format = params.get("format") ?? "xlsx";
    if (!["xlsx", "csv"].includes(format))
      throw new AppError(400, "Choose Excel or CSV");
    const where = await recordWhere(name, user, params),
      d = delegate(name);
    if ((await d.count({ where })) > 5000)
      throw new AppError(
        413,
        "Narrow your search; exports support up to 5,000 records",
      );
    const records = await d.findMany({
      where,
      include: resources[name].include,
      take: 5001,
      orderBy: { createdAt: "desc" },
    });
    if (records.length > 5000)
      throw new AppError(
        413,
        "Narrow your search; exports support up to 5,000 records",
      );
    const columns = configs[name].columns;
    const rows = records.map((row) => {
      const safe = safeRecord(name, row);
      return columns.map((key) =>
        safe[key] == null
          ? ""
          : typeof safe[key] === "object"
            ? label(safe[key])
            : String(safe[key]),
      );
    });
    let bytes: Buffer;
    if (format === "csv")
      bytes = Buffer.from(
        "\uFEFF" +
          [columns, ...rows]
            .map((row) => row.map(csvCell).join(","))
            .join("\r\n"),
      );
    else {
      const book = new ExcelJS.Workbook(),
        sheet = book.addWorksheet("Records");
      sheet.addRow(columns);
      rows.forEach((row) => sheet.addRow(row));
      sheet.getRow(1).font = { bold: true };
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.columns.forEach((column) => {
        column.width = 26;
      });
      bytes = Buffer.from(await book.xlsx.writeBuffer());
    }
    await audit(user.id, "EXPORT", name, undefined, {
      rows: rows.length,
      format,
    });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type":
          format === "csv"
            ? "text/csv; charset=utf-8"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="medops-${name}.${format}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
