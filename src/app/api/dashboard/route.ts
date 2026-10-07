import { invoiceLedger } from "@/lib/revenue";
import { api } from "@/lib/errors";
import { authorize, can } from "@/lib/auth";
import { recordWhere } from "@/lib/record-query";
import { db } from "@/lib/db";
import { addDays, money, daysOverdue } from "@/lib/business";
export async function GET() {
  return api(async () => {
    const user = await authorize("dashboard"),
      now = new Date(),
      cards: { label: string; value: string | number; module: string }[] = [];
    if (can(user, "tasks"))
      cards.push({
        label: "Open tasks",
        value: await db.task.count({
          where: {
            status: { in: ["OPEN", "IN_PROGRESS"] },
            ...(user.role !== "ADMIN"
              ? { OR: [{ createdById: user.id }, { assignedToId: user.id }] }
              : {}),
          },
        }),
        module: "tasks",
      });
    if (can(user, "tenders")) {
      cards.push({
        label: "Active tenders",
        value: await db.tender.count({
          where: { status: { notIn: ["WON", "LOST", "CANCELLED"] } },
        }),
        module: "tenders",
      });
      cards.push({
        label: "Tender documents pending",
        value: await db.tender.count({
          where: {
            status: { in: ["DRAFT", "UNDER_REVIEW", "DOCUMENTS_IN_PROGRESS"] },
          },
        }),
        module: "tenders",
      });
    }
    if (can(user, "orders"))
      cards.push({
        label: "Active purchase orders",
        value: await db.purchaseOrder.count({
          where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
        }),
        module: "orders",
      });
    if (can(user, "deliveries"))
      cards.push({
        label: "Upcoming deliveries",
        value: await db.delivery.count({ where: { confirmed: false } }),
        module: "deliveries",
      });
    if (can(user, "equipment"))
      cards.push({
        label: "Pending installations",
        value: await db.equipment.count({
          where: {
            OR: [
              { installation: null },
              { installation: { status: { in: ["PENDING", "PARTIAL"] } } },
            ],
          },
        }),
        module: "equipment",
      });
    if (can(user, "warranties"))
      cards.push({
        label: "Warranties expiring in 90 days",
        value: await db.warranty.count({
          where: { endDate: { gte: now, lte: addDays(now, 90) } },
        }),
        module: "warranties",
      });
    if (can(user, "amcs"))
      cards.push({
        label: "Active AMC contracts",
        value: await db.amcContract.count({
          where: { status: "ACTIVE", endDate: { gte: now } },
        }),
        module: "amcs",
      });
    let finances: unknown = {
      outstanding: "0.00",
      received: "0.00",
      invoiced: "0.00",
      byCustomer: [],
      recentPayments: [],
      expectedThisMonth: [],
      followups: [],
    };
    if (can(user, "invoices")) {
      const invoices = await db.invoice.findMany({
        include: { payments: true, adjustments: true, customer: true },
      });
      let balance = 0n,
        total = 0n,
        received = 0n,
        overdue = 0n,
        overdueCount = 0;
      const byCustomer = new Map<string, bigint>();
      const expectedThisMonth: object[] = [];
      for (const i of invoices) {
        const ledger = invoiceLedger(i.total, i.payments, i.adjustments),
          paid = ledger.received,
          out = ledger.outstanding;
        total += ledger.charged;
        received += paid;
        balance += out;
        if (out > 0n && daysOverdue(i.dueDate, now) > 0) {
          overdue += out;
          overdueCount++;
        }
        byCustomer.set(
          i.customer.name,
          (byCustomer.get(i.customer.name) ?? 0n) + out,
        );
        if (
          out > 0n &&
          i.dueDate.getUTCMonth() === now.getUTCMonth() &&
          i.dueDate.getUTCFullYear() === now.getUTCFullYear()
        )
          expectedThisMonth.push({
            number: i.number,
            dueDate: i.dueDate,
            outstanding: money(out),
          });
      }
      cards.push(
        {
          label: "Outstanding payments",
          value: "₹ " + money(balance),
          module: "invoices",
        },
        { label: "Overdue invoices", value: overdueCount, module: "invoices" },
      );
      finances = {
        outstanding: money(balance),
        invoiced: money(total),
        received: money(received),
        overdue: money(overdue),
        byCustomer: [...byCustomer].map(([name, amount]) => ({
          name,
          amount: money(amount),
        })),
        expectedThisMonth,
        recentPayments: can(user, "payments")
          ? await db.payment.findMany({
              take: 5,
              orderBy: { paymentDate: "desc" },
              include: { invoice: { select: { number: true } } },
            })
          : [],
        followups: can(user, "followups")
          ? await db.paymentFollowUp.findMany({
              where: { nextDate: { lte: addDays(now, 7) } },
              take: 5,
              include: { invoice: { select: { number: true } } },
            })
          : [],
      };
    }
    const allowed = [
      "tasks",
      "tenders",
      "documents",
      "orders",
      "equipment",
      "warranties",
      "amcs",
      "invoices",
      "followups",
    ].filter((m) => can(user, m));
    const deadlines = await db.notification.findMany({
      where: {
        ...(await recordWhere("notifications", user, new URLSearchParams())),
        module: { in: allowed },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    cards.push({
      label: "Upcoming tasks",
      value: deadlines.length,
      module: "notifications",
    });
    const activity = can(user, "audit")
      ? await db.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          select: { id: true, action: true, module: true, createdAt: true },
        })
      : [];
    return Response.json({ cards, finances, deadlines, activity });
  });
}
