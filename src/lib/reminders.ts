import { db } from "./db";
import { addDays, cents } from "./business";
export type Reminder = {
  key: string;
  module: string;
  recordId: string;
  title: string;
  priority: string;
  eligibleUserIds?: string[];
};
export function dateReminder(
  module: string,
  id: string,
  title: string,
  date: Date,
  now: Date,
  days: number,
): Reminder | null {
  const remaining = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  if (remaining > days) return null;
  return {
    key: `${module}:${id}:${date.toISOString().slice(0, 10)}:${days}`,
    module,
    recordId: id,
    title: `${title} · ${date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" })}`,
    priority: remaining <= 7 ? "HIGH" : "NORMAL",
  };
}
export async function runReminders(now = new Date()) {
  const reminders: Reminder[] = [];
  const company = await db.companyProfile.findFirst();
  const days = company?.reminderDays ?? 30;
  const until = addDays(now, days);
  function add(r: Reminder | null) {
    if (r) reminders.push(r);
  }
  for (const t of await db.tender.findMany({
    where: { status: { notIn: ["WON", "LOST", "CANCELLED", "SUBMITTED"] } },
    include: { files: true, generated: true },
  })) {
    if (t.deadline)
      add(
        dateReminder(
          "tenders",
          t.id,
          `Tender deadline: ${t.number}`,
          t.deadline,
          now,
          days,
        ),
      );
    if (!t.files.length || !t.generated.length)
      reminders.push({
        key: `missing:${t.id}`,
        module: "tenders",
        recordId: t.id,
        title: `Missing tender documents: ${t.number}`,
        priority: "NORMAL",
      });
  }
  for (const d of await db.companyDocument.findMany({
    where: { active: true, expiryDate: { lte: until } },
  }))
    if (d.expiryDate)
      add(
        dateReminder(
          "documents",
          d.id,
          `Certificate expires: ${d.name}`,
          d.expiryDate,
          now,
          days,
        ),
      );
  for (const o of await db.purchaseOrder.findMany({
    where: {
      status: { notIn: ["DELIVERED", "COMPLETED", "CANCELLED"] },
      deliveryDeadline: { lte: until },
    },
  }))
    if (o.deliveryDeadline)
      add(
        dateReminder(
          "orders",
          o.id,
          `Delivery deadline: ${o.number}`,
          o.deliveryDeadline,
          now,
          days,
        ),
      );
  for (const e of await db.equipment.findMany({
    where: {
      OR: [
        { installation: null },
        { installation: { status: { in: ["PENDING", "PARTIAL"] } } },
      ],
    },
  }))
    reminders.push({
      key: `installation:${e.id}`,
      module: "equipment",
      recordId: e.id,
      title: `Installation pending: ${e.serialNumber}`,
      priority: "NORMAL",
    });
  for (const w of await db.warranty.findMany({
    where: { endDate: { lte: addDays(now, 90) } },
    include: { equipment: true },
  })) {
    add(
      dateReminder(
        "warranties",
        w.id,
        `Warranty expires: ${w.equipment.serialNumber}`,
        w.endDate,
        now,
        90,
      ),
    );
    add(
      dateReminder(
        "warranties",
        w.id,
        `Warranty expires within 30 days: ${w.equipment.serialNumber}`,
        w.endDate,
        now,
        30,
      ),
    );
  }
  for (const a of await db.amcContract.findMany({
    where: { status: "ACTIVE" },
  })) {
    add(
      dateReminder(
        "amcs",
        a.id,
        `AMC renewal: ${a.number}`,
        a.endDate,
        now,
        days,
      ),
    );
    if (a.nextServiceDate)
      add(
        dateReminder(
          "amcs",
          a.id,
          `Preventive maintenance: ${a.number}`,
          a.nextServiceDate,
          now,
          days,
        ),
      );
  }
  for (const i of await db.invoice.findMany({
    where: { dueDate: { lt: now } },
    include: { payments: true },
  }))
    if (
      i.payments.reduce((s, p) => s + cents(String(p.amount)), 0n) <
      cents(String(i.total))
    )
      add(
        dateReminder(
          "invoices",
          i.id,
          `Invoice overdue: ${i.number}`,
          i.dueDate,
          now,
          0,
        ),
      );
  for (const f of await db.paymentFollowUp.findMany({
    where: { nextDate: { lte: now } },
  }))
    if (f.nextDate)
      add(
        dateReminder(
          "followups",
          f.id,
          "Payment follow-up due",
          f.nextDate,
          now,
          0,
        ),
      );
  for (const task of await db.task.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] }, dueDate: { lte: until } },
  })) {
    if (!task.dueDate) continue;
    const reminder = dateReminder(
      "tasks",
      task.id,
      `Task due: ${task.title}`,
      task.dueDate,
      now,
      days,
    );
    if (reminder)
      reminders.push({
        ...reminder,
        eligibleUserIds: [
          task.createdById,
          ...(task.assignedToId ? [task.assignedToId] : []),
        ],
      });
  }
  const users = await db.user.findMany({
    where: { active: true },
    include: { permissions: true },
  });
  let count = 0;
  for (const user of users) {
    const activeKeys: string[] = [];
    for (const reminder of reminders) {
      if (
        user.role !== "ADMIN" &&
        !user.permissions.some((p) => p.module === reminder.module && p.read)
      )
        continue;
      if (
        user.role !== "ADMIN" &&
        reminder.eligibleUserIds &&
        !reminder.eligibleUserIds.includes(user.id)
      )
        continue;
      activeKeys.push(reminder.key);
      const { eligibleUserIds: _, ...notification } = reminder;
      void _;
      await db.notification.upsert({
        where: { userId_key: { userId: user.id, key: reminder.key } },
        create: { ...notification, userId: user.id },
        update: { title: reminder.title, priority: reminder.priority },
      });
      count++;
    }
    await db.notification.updateMany({
      where: { userId: user.id, key: { notIn: activeKeys }, dismissedAt: null },
      data: { dismissedAt: now },
    });
  }
  await db.session.deleteMany({ where: { expiresAt: { lt: now } } });
  await db.auditLog.create({
    data: {
      action: "REMINDER_RUN",
      module: "notifications",
      details: { evaluated: reminders.length, recipients: users.length },
    },
  });
  return { evaluated: reminders.length, notifications: count };
}
