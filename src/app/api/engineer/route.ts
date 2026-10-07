import { api } from "@/lib/errors";
import { authorizeResource } from "@/lib/record-access";
import { db } from "@/lib/db";
export async function GET(req: Request) {
  return api(async () => {
    const user = await authorizeResource("engineer");
    await authorizeResource("tickets");
    const now = new Date(),
      day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(now),
      start = new Date(`${day}T00:00:00+05:30`),
      end = new Date(start.getTime() + 86400000);
    const engineerId =
      user.role === "ADMIN"
        ? (new URL(req.url).searchParams.get("employeeId") ?? user.id)
        : user.id;
    const tickets = await db.serviceTicket.findMany({
      where: {
        assignedToId: engineerId,
        status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] },
      },
      include: {
        customer: { select: { name: true, address: true, phone: true } },
      },
      orderBy: { scheduledVisit: "asc" },
    });
    const visits = await db.ticketVisit.findMany({
      where: { engineerId, status: { in: ["SCHEDULED", "STARTED"] } },
      include: { ticket: { select: { id: true, number: true } } },
      orderBy: { scheduledAt: "asc" },
    });
    return Response.json({
      engineerId,
      tickets,
      today: visits.filter(
        (v) => v.scheduledAt >= start && v.scheduledAt < end,
      ),
      overdue: visits.filter((v) => v.scheduledAt < start),
      now,
    });
  });
}
