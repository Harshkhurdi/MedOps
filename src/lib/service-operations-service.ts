import type { Prisma } from "@/generated/prisma/client";
import { type Actor, can } from "./auth";
import { AppError } from "./errors";
import { inventoryBalance } from "./service-operations";
const closed = ["RESOLVED", "CLOSED", "CANCELLED"];
export async function prepareService(
  tx: Prisma.TransactionClient,
  name: string,
  data: Record<string, unknown>,
  user: Actor,
  old: Record<string, unknown> | null,
  id?: string,
) {
  if (["sla-rules", "compatibility"].includes(name) && user.role !== "ADMIN")
    throw new AppError(403, "Administrator configuration required");
  for (const f of ["assignedToId", "engineerId"])
    if (
      data[f] &&
      !(await tx.user.findFirst({
        where: { id: String(data[f]), active: true },
      }))
    )
      throw new AppError(400, "Choose an active employee");
  if (
    ["tickets", "amc-opportunities", "consumable-opportunities"].includes(
      name,
    ) &&
    data.equipmentId
  ) {
    const equipment = await tx.equipment.findUnique({
      where: { id: String(data.equipmentId) },
      include: { orderItem: true },
    });
    if (!equipment || equipment.customerId !== data.customerId)
      throw new AppError(400, "Equipment must belong to the selected customer");
    if (name === "tickets") {
      if (data.serialNumber && data.serialNumber !== equipment.serialNumber)
        throw new AppError(400, "Serial number must match saved equipment");
      data.serialNumber = equipment.serialNumber;
      const manufacturerId =
        equipment.manufacturerId ?? equipment.orderItem?.manufacturerId;
      if (
        data.manufacturerId &&
        manufacturerId &&
        data.manufacturerId !== manufacturerId
      )
        throw new AppError(400, "Manufacturer must match equipment");
      data.manufacturerId ||= manufacturerId;
      data.model ||= equipment.model ?? equipment.orderItem?.model;
    }
  }
  if (name === "tickets") {
    if (old) {
      for (const f of [
        "number",
        "customerId",
        "equipmentId",
        "serialNumber",
        "reportedAt",
      ]) {
        const before = old[f],
          after = data[f];
        if (
          (before instanceof Date ? before.toISOString() : (before ?? null)) !==
          (after instanceof Date ? after.toISOString() : (after ?? null))
        )
          throw new AppError(
            409,
            "Ticket identity and reported date are immutable",
          );
      }
      if (old.status === "RESOLVED")
        for (const f of ["resolution", "resolvedAt", "assignedToId"]) {
          const a = old[f],
            b = data[f];
          if (
            (a instanceof Date ? a.toISOString() : (a ?? null)) !==
            (b instanceof Date ? b.toISOString() : (b ?? null))
          )
            throw new AppError(409, "Resolved ticket details are immutable");
        }
      if (
        ["CLOSED", "CANCELLED"].includes(String(old.status)) ||
        (old.status === "RESOLVED" && data.status !== "CLOSED")
      )
        throw new AppError(
          409,
          "Closed tickets are immutable; create a new ticket",
        );
    }
    if (
      !old &&
      !data.historical &&
      !["OPEN", "ASSIGNED", "VISIT_SCHEDULED"].includes(String(data.status))
    )
      throw new AppError(
        400,
        "New tickets start Open, Assigned or Visit Scheduled",
      );
    if (
      ["ASSIGNED", "VISIT_SCHEDULED", "IN_PROGRESS"].includes(
        String(data.status),
      ) &&
      !data.assignedToId
    )
      throw new AppError(400, "Assign an engineer first");
    if (data.status === "VISIT_SCHEDULED" && !data.scheduledVisit)
      throw new AppError(400, "Scheduled visit date is required");
    if (
      ["RESOLVED", "CLOSED"].includes(String(data.status)) &&
      (!data.resolution || !data.resolvedAt)
    )
      throw new AppError(400, "Resolution and resolved date are required");
    if (data.resolvedAt && data.resolvedAt < data.reportedAt!)
      throw new AppError(400, "Resolution cannot precede report");
    if (data.scheduledVisit && data.scheduledVisit < data.reportedAt!)
      throw new AppError(400, "Visit cannot precede report");
    if (data.assignedToId && (!old || old.assignedToId !== data.assignedToId))
      data.assignedAt = new Date();
    if (data.slaRuleId && (!old || old.slaRuleId !== data.slaRuleId)) {
      const rule = await tx.slaRule.findUnique({
        where: { id: String(data.slaRuleId) },
      });
      if (
        !rule?.active ||
        (rule.customerId && rule.customerId !== data.customerId) ||
        (rule.manufacturerId && rule.manufacturerId !== data.manufacturerId)
      )
        throw new AppError(
          400,
          "SLA rule does not match this customer/manufacturer",
        );
      if (
        rule.amcId &&
        !(await tx.amcEquipment.findFirst({
          where: {
            amcId: rule.amcId,
            equipmentId: String(data.equipmentId ?? ""),
            amc: { customerId: String(data.customerId), status: "ACTIVE" },
          },
        }))
      )
        throw new AppError(400, "SLA AMC does not cover this equipment");
      if (
        rule.warrantyType &&
        !(await tx.warranty.findFirst({
          where: {
            equipmentId: String(data.equipmentId ?? ""),
            type: rule.warrantyType,
            startDate: { lte: data.reportedAt as Date },
            endDate: { gte: data.reportedAt as Date },
          },
        }))
      )
        throw new AppError(
          400,
          "SLA warranty type does not cover this equipment",
        );
      for (const [target, hours] of [
        ["assignmentDueAt", rule.assignmentHours],
        ["firstVisitDueAt", rule.firstVisitHours],
        ["resolutionDueAt", rule.resolutionHours],
      ] as const)
        data[target] = new Date(
          (data.reportedAt as Date).getTime() + hours * 3600000,
        );
    }
  }
  if (name === "ticket-visits") {
    const ticket = await tx.serviceTicket.findUnique({
      where: { id: String(data.ticketId) },
    });
    if (!ticket || closed.includes(ticket.status))
      throw new AppError(400, "Choose an open service ticket");
    if (data.engineerId !== ticket.assignedToId)
      throw new AppError(
        400,
        "Visit engineer must match assigned ticket engineer",
      );
    if (user.role !== "ADMIN" && data.engineerId !== user.id)
      throw new AppError(403, "Engineers record their own visits");
    if (old?.status === "COMPLETED" || old?.status === "CANCELLED")
      throw new AppError(405, "Completed/cancelled visits are immutable");
    if (
      old &&
      (old.ticketId !== data.ticketId || old.engineerId !== data.engineerId)
    )
      throw new AppError(409, "Visit relationships cannot change");
    if (
      ["STARTED", "COMPLETED"].includes(String(data.status)) &&
      !data.startedAt
    )
      throw new AppError(400, "Record the actual visit start");
    if (data.status === "COMPLETED" && (!data.completedAt || !data.workDone))
      throw new AppError(
        400,
        "Completion date and work performed are required",
      );
    if ((data.scheduledAt as Date) < ticket.reportedAt)
      throw new AppError(400, "Scheduled visit cannot precede report");
    if (data.startedAt && data.startedAt < ticket.reportedAt)
      throw new AppError(400, "Visit start cannot precede report");
    if (
      data.completedAt &&
      (!data.startedAt || data.completedAt < data.startedAt)
    )
      throw new AppError(400, "Completion must follow start");
    if (
      data.nextVisit &&
      data.nextVisit < (data.completedAt ?? data.scheduledAt)!
    )
      throw new AppError(400, "Next visit must follow this visit");
    if (data.startedAt) {
      await tx.serviceTicket.update({
        where: { id: ticket.id },
        data: {
          firstVisitAt: ticket.firstVisitAt ?? (data.startedAt as Date),
          status: "IN_PROGRESS",
        },
      });
    }
  }
  if (name === "amc-opportunities" && data.amcId) {
    const contract = await tx.amcContract.findUnique({
      where: { id: String(data.amcId) },
    });
    if (
      !contract ||
      contract.customerId !== data.customerId ||
      !(await tx.amcEquipment.findFirst({
        where: { amcId: contract.id, equipmentId: String(data.equipmentId) },
      }))
    )
      throw new AppError(400, "AMC must cover this customer and equipment");
  }
  if (name === "consumable-opportunities") {
    const consumable = await tx.consumable.findUnique({
      where: { id: String(data.consumableId) },
    });
    if (!consumable?.active)
      throw new AppError(400, "Choose an active consumable");
    if (data.equipmentId) {
      const e = await tx.equipment.findUniqueOrThrow({
        where: { id: String(data.equipmentId) },
      });
      if (
        !e.productId ||
        !(await tx.consumableCompatibility.findFirst({
          where: {
            productId: e.productId,
            consumableId: consumable.id,
            active: true,
          },
        }))
      )
        throw new AppError(
          400,
          "Administrator-approved product compatibility is required",
        );
    }
    if (data.lastSale && data.nextFollowUp && data.nextFollowUp < data.lastSale)
      throw new AppError(400, "Follow-up cannot precede last sale");
  }
  if (name === "parts" && !can(user, "pricing", true)) {
    if (data.unitCost != null)
      throw new AppError(
        403,
        "Pricing edit permission is required for unit cost",
      );
    delete data.unitCost;
  }
  if (name === "inventory") {
    if (id) throw new AppError(405, "Stock transactions are immutable");
    if (data.type === "ADJUSTMENT" && !can(user, "inventory-adjust", true))
      throw new AppError(403, "Inventory adjustment permission required");
    if (data.type === "ADJUSTMENT" && !data.notes)
      throw new AppError(400, "Adjustment reason is required");
    if (
      data.allowNegative &&
      (data.type !== "ADJUSTMENT" || user.role !== "ADMIN")
    )
      throw new AppError(
        403,
        "Only administrators may explicitly confirm a negative adjustment",
      );
    const part = await tx.sparePart.findUnique({
      where: { id: String(data.partId) },
    });
    if (!part?.active) throw new AppError(400, "Choose an active part");
    if (data.ticketId) {
      const ticket = await tx.serviceTicket.findUnique({
        where: { id: String(data.ticketId) },
      });
      if (!ticket || closed.includes(ticket.status))
        throw new AppError(400, "Choose an open service ticket");
      if (data.engineerId && data.engineerId !== ticket.assignedToId)
        throw new AppError(400, "Parts engineer must match assigned engineer");
    }
    if (data.type === "USED_IN_SERVICE" && (!data.ticketId || !data.engineerId))
      throw new AppError(400, "Service part use requires ticket and engineer");
    if (
      data.fromReserved &&
      !["OUT", "USED_IN_SERVICE"].includes(String(data.type))
    )
      throw new AppError(400, "Only stock issue can consume a reservation");
    if (
      user.role !== "ADMIN" &&
      data.type === "USED_IN_SERVICE" &&
      data.engineerId !== user.id
    )
      throw new AppError(403, "Engineers record their own part usage");
    let balances: { onHand: number; reserved: number };
    try {
      balances = inventoryBalance(
        part.onHand,
        part.reserved,
        String(data.type),
        Number(data.quantity),
        Boolean(data.fromReserved),
      );
    } catch (e) {
      throw new AppError(400, (e as Error).message);
    }
    if (balances.onHand < 0 && !data.allowNegative)
      throw new AppError(
        400,
        "Stock cannot become negative without a privileged confirmed adjustment",
      );
    if (Math.abs(balances.onHand) > 2147483647)
      throw new AppError(400, "Stock exceeds supported range");
    await tx.sparePart.update({ where: { id: part.id }, data: balances });
    data.actorId = user.id;
    data.onHandAfter = balances.onHand;
    data.reservedAfter = balances.reserved;
    delete data.allowNegative;
  }
  return data;
}
