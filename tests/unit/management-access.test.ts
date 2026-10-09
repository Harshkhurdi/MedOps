import { beforeEach, expect, it, vi } from "vitest";
import { managementReport } from "@/lib/management";
import { todaysBrief } from "@/lib/brief";
import type { Actor } from "@/lib/auth";
const modelNames = [
  "invoice",
  "operationalCost",
  "tender",
  "rfq",
  "quotationRevision",
  "purchaseOrder",
  "equipment",
  "serviceTicket",
  "salesOpportunity",
  "amcContract",
  "amcOpportunity",
  "consumableOpportunity",
  "customer",
  "manufacturer",
  "delivery",
  "warranty",
  "approval",
  "security",
  "payment",
  "financialAdjustment",
  "product",
];
const { mockDb } = vi.hoisted(() => ({
  mockDb: {} as Record<
    string,
    { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> }
  >,
}));
vi.mock("@/lib/db", () => ({ db: mockDb }));
beforeEach(() => {
  for (const name of modelNames)
    mockDb[name] = {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    };
});
function actor(modules: string[]): Actor {
  return {
    role: "EMPLOYEE",
    permissions: modules.map((module) => ({
      module,
      read: true,
      write: false,
    })),
  } as Actor;
}
it("hides result and decision metrics without their separate permissions, including Pricing", async () => {
  const report = await managementReport(
    actor(["analytics", "pricing", "tenders"]),
    new URLSearchParams(),
  );
  expect(mockDb.tender.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      include: expect.objectContaining({ results: false, decisions: false }),
    }),
  );
  expect(report.cards).toMatchObject({
    pursuedTenders: null,
    wins: null,
    losses: null,
    winRate: null,
  });
  expect(report.lossReasons).toEqual({});
  await managementReport(
    actor(["analytics", "tenders", "results"]),
    new URLSearchParams(),
  );
  expect(mockDb.tender.findMany).toHaveBeenLastCalledWith(
    expect.objectContaining({
      include: expect.objectContaining({ results: false }),
    }),
  );
});
it("applies product and manufacturer filters to the same tender and order line", async () => {
  await managementReport(
    { role: "ADMIN" } as Actor,
    new URLSearchParams({
      productId: "product",
      manufacturerId: "manufacturer",
    }),
  );
  for (const model of ["tender", "purchaseOrder"])
    expect(mockDb[model].findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          items: {
            some: { productId: "product", manufacturerId: "manufacturer" },
          },
        }),
        include: expect.objectContaining({
          items: expect.objectContaining({
            where: { productId: "product", manufacturerId: "manufacturer" },
          }),
        }),
      }),
    );
});

it("uses India's current month for calendar-date receipts and reversals", async () => {
  mockDb.payment.findMany.mockResolvedValue([{ amount: "100.00" }]);
  mockDb.financialAdjustment.findMany.mockResolvedValue([{ amount: "25.00" }]);
  const report = await managementReport(
    actor(["analytics", "pricing", "payments"]),
    new URLSearchParams(),
    new Date("2026-09-30T20:00:00Z"),
  );
  const october = {
    gte: new Date("2026-10-01T00:00:00Z"),
    lt: new Date("2026-11-01T00:00:00Z"),
  };
  expect(mockDb.payment.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ paymentDate: october }),
    }),
  );
  expect(mockDb.financialAdjustment.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        type: "PAYMENT_REVERSAL",
        adjustmentDate: october,
      }),
    }),
  );
  expect(report.cards.paymentsReceivedThisMonth).toBe("75.00");
});

it("does not reveal tender decision state through Today's Brief without Decisions access", async () => {
  mockDb.tender.findMany.mockResolvedValue([
    {
      id: "tender",
      number: "Tender",
      deadline: null,
      requirements: [],
      checklist: [],
    },
  ]);
  const limited = actor(["brief", "tenders"]);
  expect(await todaysBrief(limited, new URLSearchParams())).toEqual([]);
  expect(mockDb.tender.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      include: expect.objectContaining({ decisions: false }),
    }),
  );
  expect(
    await todaysBrief(
      actor(["brief", "tenders", "decisions"]),
      new URLSearchParams(),
    ),
  ).toEqual([expect.objectContaining({ action: "Awaiting decision" })]);
});
