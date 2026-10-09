import { api, AppError } from "@/lib/errors";
import { authorizeResource, canResource } from "@/lib/record-access";
import { db } from "@/lib/db";

type Period = { startDate: Date; endDate: Date; status?: string };
function status(periods: Period[], today: string) {
  const eligible = periods.filter((period) =>
    period.status === undefined || period.status === "ACTIVE",
  );
  if (eligible.some((period) =>
    period.startDate.toISOString().slice(0, 10) <= today &&
    period.endDate.toISOString().slice(0, 10) >= today,
  )) return "Active";
  if (eligible.some((period) => period.startDate.toISOString().slice(0, 10) > today))
    return "Upcoming";
  return periods.length ? "Expired or inactive" : "Not recorded";
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    const user = await authorizeResource("tickets");
    const { id } = await ctx.params;
    const ticket = await db.serviceTicket.findUnique({
      where: { id },
      select: { equipmentId: true },
    });
    if (!ticket) throw new AppError(404, "Service ticket not found");
    const now = new Date();
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(now);
    const data: Record<string, unknown> = {
      evaluatedAt: now,
      basis: "Current India calendar date; verify actual contractual terms before service",
    };
    if (!ticket.equipmentId)
      return Response.json({ ...data, equipmentLinked: false });
    if (canResource(user, "warranties")) {
      const warranties = await db.warranty.findMany({
        where: { equipmentId: ticket.equipmentId },
        select: { id: true, type: true, commencement: true, startDate: true, endDate: true },
        orderBy: { startDate: "desc" },
        take: 1001,
      });
      if (warranties.length > 1000)
        throw new AppError(413, "Coverage exceeds 1,000 warranty records; review the warranty register");
      data.warrantyStatus = status(warranties, today);
      data.warranties = warranties;
    }
    if (canResource(user, "amcs")) {
      const amcs = await db.amcContract.findMany({
        where: { equipment: { some: { equipmentId: ticket.equipmentId } } },
        select: { id: true, number: true, status: true, startDate: true, endDate: true },
        orderBy: { startDate: "desc" },
        take: 1001,
      });
      if (amcs.length > 1000)
        throw new AppError(413, "Coverage exceeds 1,000 AMC records; review the AMC register");
      data.amcStatus = status(amcs, today);
      data.amcs = amcs;
    }
    return Response.json(data);
  });
}
