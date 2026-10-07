import { z } from "zod";
import { api, AppError } from "@/lib/errors";
import { authorize, audit } from "@/lib/auth";
import { authorizeResource } from "@/lib/record-access";
import { managementReport } from "@/lib/management";
import { tableExport } from "@/lib/table-export";
export async function GET(req: Request) {
  return api(async () => {
    const p = new URL(req.url).searchParams,
      view = z
        .enum(["analytics", "profitability", "executive"])
        .parse(p.get("view") ?? "analytics"),
      section = z
        .enum([
          "profitability",
          "customerMetrics",
          "manufacturers",
          "productMetrics",
        ])
        .parse(p.get("section") ?? "profitability"),
      format = z.enum(["csv", "xlsx"]).parse(p.get("format") ?? "xlsx"),
      u = await authorizeResource(view);
    await authorize("exports", true);
    const data = await managementReport(u, p),
      rows =
        section === "profitability"
          ? data.profitability?.groups
          : data[section];
    if (!rows)
      throw new AppError(403, "Underlying register permissions are required");
    await audit(u.id, "EXPORT", view, undefined, {
      section,
      rows: rows.length,
      format,
    });
    return tableExport(
      rows,
      Object.keys(
        rows[0] ?? {
          dimension: "",
          key: "",
          revenue: "",
          recordedCosts: "",
          grossContribution: "",
        },
      ),
      format,
      section,
    );
  });
}
