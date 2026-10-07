import { api, AppError } from "@/lib/errors";
import { authorizeResource, canResource } from "@/lib/record-access";
import { db } from "@/lib/db";
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    const user = await authorizeResource("equipment"),
      { id } = await ctx.params;
    const equipment = await db.equipment.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, address: true } },
        manufacturer: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        installation: true,
        delivery: { select: { id: true, actualDate: true } },
        order: { select: { id: true, number: true } },
        orderItem: { select: { equipment: true, model: true } },
      },
    });
    if (!equipment) throw new AppError(404, "Equipment not found");
    const data: Record<string, unknown> = { equipment };
    if (canResource(user, "warranties"))
      data.warranties = await db.warranty.findMany({
        where: { equipmentId: id },
        orderBy: { startDate: "asc" },
      });
    if (canResource(user, "amcs"))
      data.amcs = await db.amcEquipment.findMany({
        where: { equipmentId: id },
        include: {
          amc: {
            select: {
              id: true,
              number: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });
    if (canResource(user, "tickets"))
      data.tickets = await db.serviceTicket.findMany({
        where: { equipmentId: id },
        orderBy: { reportedAt: "asc" },
      });
    if (canResource(user, "ticket-visits"))
      data.visits = await db.ticketVisit.findMany({
        where: { ticket: { equipmentId: id } },
        orderBy: { scheduledAt: "asc" },
      });
    if (canResource(user, "inventory"))
      data.parts = await db.inventoryTransaction.findMany({
        where: { ticket: { equipmentId: id } },
        include: { part: { select: { sku: true, name: true } } },
        orderBy: { transactionDate: "asc" },
      });
    if (canResource(user, "consumable-opportunities"))
      data.consumables = await db.consumableOpportunity.findMany({
        where: { equipmentId: id },
        include: { consumable: { select: { name: true, sku: true } } },
      });
    return Response.json(data);
  });
}
