import { z } from "zod";
import { api, AppError } from "@/lib/errors";
import { authorizeResource } from "@/lib/record-access";
import { authorize, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordWhere } from "@/lib/record-query";
import { slaMetrics } from "@/lib/service-metrics";
import { tableExport } from "@/lib/table-export";
export async function GET(req: Request) {
  return api(async () => {
    const u = await authorizeResource("service-sla");
    await authorizeResource("tickets");
    await authorize("exports", true);
    const p = new URL(req.url).searchParams,
      where = await recordWhere("tickets", u, p),
      format = z.enum(["csv", "xlsx"]).parse(p.get("format") ?? "xlsx"),
      tickets = await db.serviceTicket.findMany({
        where,
        take: 5001,
        orderBy: { reportedAt: "desc" },
      });
    if (tickets.length > 5000)
      throw new AppError(413, "Narrow SLA export to 5,000 tickets");
    const rows = tickets.map((t) => ({
      id: t.id,
      number: t.number,
      customerId: t.customerId,
      status: t.status,
      priority: t.priority,
      reportedAt: t.reportedAt.toISOString(),
      assignedAt: t.assignedAt?.toISOString() ?? "",
      firstVisitAt: t.firstVisitAt?.toISOString() ?? "",
      resolvedAt: t.resolvedAt?.toISOString() ?? "",
      assignmentDueAt: t.assignmentDueAt?.toISOString() ?? "",
      firstVisitDueAt: t.firstVisitDueAt?.toISOString() ?? "",
      resolutionDueAt: t.resolutionDueAt?.toISOString() ?? "",
      slaBreached: slaMetrics([t]).slaBreaches > 0,
    }));
    await audit(u.id, "EXPORT", "service-sla", undefined, {
      rows: rows.length,
      format,
    });
    return tableExport(
      rows,
      Object.keys(rows[0] ?? { number: "", status: "", slaBreached: "" }),
      format,
      "service-sla",
    );
  });
}
