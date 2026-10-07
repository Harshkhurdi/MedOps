import { beforeAll, afterAll, it, expect } from "vitest";
import { db } from "@/lib/db";
import { save } from "@/lib/service";
import { hashPassword, type Actor } from "@/lib/auth";
import { runReminders } from "@/lib/reminders";
import { recordWhere } from "@/lib/record-query";
let creator: Actor, approver: Actor, customerId: string, tenderId: string;
const suffix = Date.now();
beforeAll(async () => {
  for (const who of ["creator", "approver"]) {
    const u = await db.user.create({
      data: {
        email: `${who}-${suffix}@example.test`,
        name: `Synthetic ${who}`,
        role: "ADMIN",
        passwordHash: hashPassword("synthetic-test-password"),
      },
      include: { permissions: true },
    });
    if (who === "creator") creator = u;
    else approver = u;
  }
  customerId = String(
    (await save("customers", { name: `Control customer ${suffix}` }, creator))
      .id,
  );
  tenderId = String(
    (
      await save(
        "tenders",
        { number: `Control tender ${suffix}`, customerId },
        creator,
      )
    ).id,
  );
});
afterAll(async () => db.$disconnect());
it("retains security identity and validates expiry/refund/customer links", async () => {
  const input = {
    type: "EMD",
    customerId,
    tenderId,
    reference: `S-${suffix}`,
    amount: "1000.01",
    status: "ACTIVE",
    issueDate: "2026-10-01",
    validityDate: "2026-10-20",
    expectedRefundDate: "2026-10-10",
  };
  const s = await save("securities", input, creator);
  await expect(
    save("securities", { ...input, validityDate: "2026-09-01" }, creator),
  ).rejects.toThrow("precede");
  await expect(
    save("securities", { ...input, status: "REFUNDED" }, creator, String(s.id)),
  ).rejects.toThrow("actual refund");
  await expect(
    save("securities", { ...input, amount: "1001" }, creator, String(s.id)),
  ).rejects.toThrow("immutable");
  await save(
    "securities",
    { ...input, status: "REFUND_PENDING" },
    creator,
    String(s.id),
  );
  await runReminders(new Date("2026-10-12"));
  expect(
    await db.notification.count({ where: { recordId: String(s.id) } }),
  ).toBeGreaterThan(0);
  await save(
    "securities",
    { ...input, status: "REFUNDED", actualRefundDate: "2026-10-12" },
    creator,
    String(s.id),
  );
  await runReminders(new Date("2026-10-13"));
  expect(
    await db.notification.count({
      where: { recordId: String(s.id), dismissedAt: null },
    }),
  ).toBe(0);
});
it("keeps checklist changes manual and protects duplicate items", async () => {
  const item = await save(
    "checklist",
    {
      tenderId,
      section: "COMMERCIAL",
      title: "Confirm actual price",
      status: "PENDING",
    },
    creator,
  );
  expect(item.status).toBe("PENDING");
  await save(
    "checklist",
    {
      tenderId,
      section: "COMMERCIAL",
      title: "Confirm actual price",
      status: "COMPLETE",
    },
    creator,
    String(item.id),
  );
  await expect(
    save(
      "checklist",
      { tenderId, section: "COMMERCIAL", title: "Confirm actual price" },
      creator,
    ),
  ).rejects.toThrow();
});
it("enforces submission, assigned approver, no self-approval and immutable decision history", async () => {
  const input = {
    title: "Synthetic tender pursue",
    workflow: "TENDER_PURSUE",
    relatedModule: "tenders",
    recordId: tenderId,
    approverId: approver.id,
  };
  const a = await save("approvals", input, creator);
  await expect(
    save("approvals", { ...input, status: "APPROVED" }, creator, String(a.id)),
  ).rejects.toThrow("Submit");
  await save(
    "approvals",
    { ...input, status: "SUBMITTED" },
    creator,
    String(a.id),
  );
  await expect(
    save(
      "approvals",
      { ...input, status: "APPROVED", comments: "Confirmed" },
      creator,
      String(a.id),
    ),
  ).rejects.toThrow("assigned");
  const approved = await save(
    "approvals",
    { ...input, status: "APPROVED", comments: "Confirmed by approver" },
    approver,
    String(a.id),
  );
  expect(approved.decisionById).toBe(approver.id);
  expect(
    await db.approvalEvent.count({ where: { approvalId: String(a.id) } }),
  ).toBe(3);
  await expect(
    save("approvals", { ...input, status: "REJECTED" }, approver, String(a.id)),
  ).rejects.toThrow("immutable");
  const self = { ...input, approverId: creator.id };
  const b = await save("approvals", self, creator);
  await save(
    "approvals",
    { ...self, status: "SUBMITTED" },
    creator,
    String(b.id),
  );
  await expect(
    save(
      "approvals",
      { ...self, status: "APPROVED", comments: "self" },
      creator,
      String(b.id),
    ),
  ).rejects.toThrow("Self-approval");
});
it("rejects approving a changed record, checks role policies and hides linked pricing", async () => {
  const input = {
    title: "Stale review",
    workflow: "TENDER_PURSUE",
    relatedModule: "tenders",
    recordId: tenderId,
    approverId: approver.id,
  };
  const a = await save("approvals", input, creator);
  await save(
    "approvals",
    { ...input, status: "SUBMITTED" },
    creator,
    String(a.id),
  );
  await save(
    "tenders",
    {
      number: `Control tender ${suffix}`,
      customerId,
      title: "Changed after submission",
    },
    creator,
    tenderId,
  );
  await expect(
    save(
      "approvals",
      { ...input, status: "APPROVED", comments: "stale" },
      approver,
      String(a.id),
    ),
  ).rejects.toThrow("changed");
  const employee = {
    ...creator,
    role: "EMPLOYEE" as const,
    permissions: [
      {
        id: "p",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: creator.id,
        module: "approvals",
        read: true,
        write: true,
      },
    ],
  };
  await expect(
    save("approval-policies", { workflow: "TENDER_PURSUE" }, employee),
  ).rejects.toThrow("Administrator");
  const where = await recordWhere("approvals", employee, new URLSearchParams());
  expect(where.relatedModule).toEqual({ in: ["approvals"] });
  await expect(save("approvals", input, employee)).rejects.toThrow("Access");
});
