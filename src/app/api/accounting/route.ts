import { z } from "zod";
import { api } from "@/lib/errors";
import { authorize, audit } from "@/lib/auth";
import {
  accountingProviders,
  accountingModules,
  accountingRows,
} from "@/lib/accounting";
import { tableExport } from "@/lib/table-export";
export async function GET(req: Request) {
  return api(async () => {
    const u = await authorize("accounting"),
      p = new URL(req.url).searchParams;
    if (!p.get("module"))
      return Response.json({
        providers: accountingProviders,
        message:
          "Exports use saved records. Tally/Zoho synchronization is unavailable until a documented connector is configured.",
      });
    await authorize("exports", true);
    const name = z.enum(accountingModules).parse(p.get("module")),
      format = z.enum(["csv", "xlsx"]).parse(p.get("format") ?? "xlsx"),
      rows = await accountingRows(u, name, p);
    await audit(u.id, "ACCOUNTING_EXPORT", name, undefined, {
      rows: rows.length,
      format,
    });
    return tableExport(
      rows,
      Object.keys(rows[0] ?? { id: "", number: "", date: "", amount: "" }),
      format,
      "accounting-" + name,
    );
  });
}
