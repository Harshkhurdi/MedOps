import { api } from "@/lib/errors";
import { authorizeResource } from "@/lib/record-access";
import { db } from "@/lib/db";
import { cents, money, addDays } from "@/lib/business";
import { checklistProgress } from "@/lib/controls";
export async function GET(req: Request) {
  return api(async () => {
    const params = new URL(req.url).searchParams;
    if (params.get("tenderId")) {
      await authorizeResource("checklist");
      const items = await db.bidChecklist.findMany({
        where: { tenderId: params.get("tenderId")! },
      });
      return Response.json(checklistProgress(items));
    }
    await authorizeResource("securities");
    const rows = await db.security.findMany();
    const now = new Date();
    const active = rows.filter((r) =>
      [
        "ISSUED",
        "SUBMITTED",
        "ACTIVE",
        "REFUND_REQUESTED",
        "REFUND_PENDING",
        "EXPIRED",
      ].includes(r.status),
    );
    const sum = (r: typeof rows) =>
      money(r.reduce((s, v) => s + cents(String(v.amount)), 0n));
    return Response.json({
      active: sum(active),
      emdBlocked: sum(active.filter((r) => r.type === "EMD")),
      pbg: sum(active.filter((r) => r.type === "PBG")),
      pendingRefunds: sum(
        active.filter((r) =>
          ["REFUND_REQUESTED", "REFUND_PENDING"].includes(r.status),
        ),
      ),
      expiring30: active.filter(
        (r) =>
          r.validityDate &&
          r.validityDate >= now &&
          r.validityDate <= addDays(now, 30),
      ).length,
      expiring90: active.filter(
        (r) =>
          r.validityDate &&
          r.validityDate >= now &&
          r.validityDate <= addDays(now, 90),
      ).length,
    });
  });
}
