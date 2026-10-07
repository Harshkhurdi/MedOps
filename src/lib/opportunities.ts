import { db } from "./db";
export function amcReason(
  warrantyEnd: Date | null,
  amcEnd: Date | null,
  activeAmc: boolean,
  now: Date,
) {
  const days = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (activeAmc)
    return amcEnd && days(amcEnd) <= 90
      ? { reason: "AMC_RENEWAL", triggerDate: amcEnd }
      : null;
  if (amcEnd && days(amcEnd) < 0)
    return { reason: "AMC_EXPIRED", triggerDate: amcEnd };
  if (warrantyEnd) {
    const d = days(warrantyEnd);
    if (d < 0) return { reason: "WARRANTY_EXPIRED", triggerDate: warrantyEnd };
    if (d <= 180)
      return { reason: "WARRANTY_ENDING", triggerDate: warrantyEnd };
    return null;
  }
  return { reason: "NO_SERVICE_CONTRACT", triggerDate: null };
}
export async function refreshAmcOpportunities(
  actorId: string | null,
  now = new Date(),
) {
  return db.$transaction(
    async (tx) => {
      const equipment = await tx.equipment.findMany({
        include: {
          warranties: { orderBy: { endDate: "desc" }, take: 1 },
          amcs: { include: { amc: true } },
        },
      });
      let created = 0,
        updated = 0;
      for (const e of equipment) {
        const contracts = e.amcs
          .map((a) => a.amc)
          .filter((a) => a.status !== "CANCELLED")
          .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
        const active = contracts.find(
            (a) =>
              a.status === "ACTIVE" && a.startDate <= now && a.endDate >= now,
          ),
          latest = active ?? contracts[0];
        const reason = amcReason(
          e.warranties[0]?.endDate ?? null,
          latest?.endDate ?? null,
          Boolean(active),
          now,
        );
        // Cover purchased future contracts as well; do not raise an uncovered opportunity.
        const future = contracts.find(
          (a) => a.status === "ACTIVE" && a.startDate > now,
        );
        if ((future && !active) || !reason) {
          const retired = await tx.amcOpportunity.updateMany({
            where: {
              equipmentId: e.id,
              generated: true,
              status: { notIn: ["WON", "LOST", "NOT_APPLICABLE"] },
            },
            data: { status: "NOT_APPLICABLE" },
          });
          if (retired.count)
            await tx.auditLog.create({
              data: {
                userId: actorId,
                action: "CLOSE_COVERED_OPPORTUNITY",
                module: "amc-opportunities",
                recordId: e.id,
                details: { count: retired.count },
              },
            });
          continue;
        }
        const same = await tx.amcOpportunity.findUnique({
          where: {
            equipmentId_reason: { equipmentId: e.id, reason: reason.reason },
          },
        });
        const open = await tx.amcOpportunity.findFirst({
          where: {
            equipmentId: e.id,
            status: { notIn: ["WON", "LOST", "NOT_APPLICABLE"] },
          },
        });
        if (same) {
          if (!["WON", "LOST", "NOT_APPLICABLE"].includes(same.status)) {
            await tx.amcOpportunity.update({
              where: { id: same.id },
              data: {
                triggerDate: reason.triggerDate,
                amcId: latest?.id ?? null,
              },
            });
            updated++;
          }
          continue;
        }
        if (open) {
          await tx.amcOpportunity.update({
            where: { id: open.id },
            data: {
              reason: reason.reason,
              triggerDate: reason.triggerDate,
              amcId: latest?.id ?? null,
            },
          });
          updated++;
        } else {
          await tx.amcOpportunity.create({
            data: {
              customerId: e.customerId,
              equipmentId: e.id,
              amcId: latest?.id ?? null,
              ...reason,
              generated: true,
            },
          });
          created++;
        }
      }
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "REFRESH_AMC_OPPORTUNITIES",
          module: "amc-opportunities",
          details: { created, updated },
        },
      });
      return { created, updated };
    },
    { isolationLevel: "Serializable", timeout: 30000 },
  );
}
