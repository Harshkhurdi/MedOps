import { api } from "@/lib/errors";
import { authorizeResource } from "@/lib/record-access";
import { db } from "@/lib/db";
import { slaMetrics } from "@/lib/service-metrics";
export async function GET() {
  return api(async () => {
    await authorizeResource("service-sla");
    await authorizeResource("tickets");
    const rows = await db.serviceTicket.findMany();
    const { breaches, ...metrics } = slaMetrics(rows);
    return Response.json({
      ...metrics,
      breaches: breaches.map((r) => ({
        id: r.id,
        number: r.number,
        status: r.status,
        priority: r.priority,
      })),
    });
  });
}
