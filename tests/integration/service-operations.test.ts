import { beforeAll, afterAll, it, expect } from "vitest";
import { db } from "@/lib/db";
import { save } from "@/lib/service";
import { hashPassword, type Actor } from "@/lib/auth";
import { refreshAmcOpportunities } from "@/lib/opportunities";
import { safeRecord } from "@/lib/record-query";
let admin: Actor,
  engineer: Actor,
  customerId: string,
  manufacturerId: string,
  productId: string,
  equipmentId: string,
  ticketId: string,
  partId: string;
const suffix = Date.now();
beforeAll(async () => {
  admin = await db.user.create({
    data: {
      email: `service-admin-${suffix}@example.test`,
      name: "Synthetic service admin",
      role: "ADMIN",
      passwordHash: hashPassword("synthetic-test-password"),
    },
    include: { permissions: true },
  });
  engineer = await db.user.create({
    data: {
      email: `engineer-${suffix}@example.test`,
      name: "Synthetic engineer",
      role: "EMPLOYEE",
      passwordHash: hashPassword("synthetic-test-password"),
      permissions: {
        create: [
          { module: "tickets", read: true, write: true },
          { module: "ticket-visits", read: true, write: true },
          { module: "inventory", read: true, write: true },
          { module: "parts", read: true, write: true },
        ],
      },
    },
    include: { permissions: true },
  });
  customerId = String(
    (await save("customers", { name: `Service customer ${suffix}` }, admin)).id,
  );
  manufacturerId = String(
    (
      await save(
        "manufacturers",
        { name: `Service manufacturer ${suffix}` },
        admin,
      )
    ).id,
  );
  productId = String(
    (
      await save(
        "products",
        {
          name: `Service product ${suffix}`,
          manufacturerId,
          model: "Synthetic",
        },
        admin,
      )
    ).id,
  );
});
afterAll(async () => db.$disconnect());
it("registers legacy equipment without recreating orders, but retains normal delivery safeguards", async () => {
  const input = {
    serialNumber: `LEGACY-${suffix}`,
    customerId,
    manufacturerId,
    productId,
    productName: "Synthetic device",
    model: "Synthetic",
    historical: true,
    originalDate: "2020-01-31",
  };
  const e = await save("equipment", input, admin);
  equipmentId = String(e.id);
  expect(e.orderId).toBeNull();
  await expect(
    save("equipment", { ...input, serialNumber: `DENY-${suffix}` }, engineer),
  ).rejects.toThrow("administrator");
  await expect(
    save(
      "equipment",
      { ...input, historical: false, serialNumber: `NORMAL-${suffix}` },
      admin,
    ),
  ).rejects.toThrow("confirmed delivery");
  await expect(save("equipment", input, admin)).rejects.toThrow();
  const w = await save(
    "warranties",
    {
      equipmentId,
      commencement: "CONTRACT",
      startDate: "2020-01-31",
      durationMonths: 1,
      terms: "Explicit actual contract",
      historical: true,
    },
    admin,
  );
  expect((w.endDate as Date).toISOString().slice(0, 10)).toBe("2020-02-29");
  await expect(
    save(
      "warranties",
      {
        equipmentId,
        commencement: "CONTRACT",
        startDate: "2020-02-01",
        durationMonths: 1,
        terms: "Overlap",
      },
      admin,
    ),
  ).rejects.toThrow("overlapping");
  const earlier = await save(
    "warranties",
    {
      equipmentId,
      commencement: "CONTRACT",
      startDate: "2019-01-01",
      durationMonths: 1,
      terms: "Earlier non-overlapping record",
      historical: true,
    },
    admin,
  );
  expect(earlier.startDate).toBeInstanceOf(Date);
});
it("creates service tickets with real SLA targets, own engineer visits and date/resolution checks", async () => {
  const rule = await save(
    "sla-rules",
    {
      name: "Synthetic SLA",
      customerId,
      manufacturerId,
      assignmentHours: 4,
      firstVisitHours: 24,
      resolutionHours: 48,
    },
    admin,
  );
  const input = {
    number: `TICKET-${suffix}`,
    customerId,
    equipmentId,
    manufacturerId,
    productName: "Synthetic device",
    issue: "Synthetic fault",
    reportedAt: "2026-10-01T08:00:00Z",
    priority: "CRITICAL",
    assignedToId: engineer.id,
    status: "ASSIGNED",
    slaRuleId: rule.id,
  };
  const t = await save("tickets", input, admin);
  ticketId = String(t.id);
  expect(t.serialNumber).toBe(`LEGACY-${suffix}`);
  expect((t.resolutionDueAt as Date).toISOString()).toBe(
    "2026-10-03T08:00:00.000Z",
  );
  await expect(
    save("tickets", { ...input, status: "RESOLVED" }, admin, ticketId),
  ).rejects.toThrow("Resolution");
  const v = await save(
    "ticket-visits",
    {
      ticketId,
      engineerId: engineer.id,
      scheduledAt: "2026-10-02T08:00:00Z",
      startedAt: "2026-10-02T08:30:00Z",
      completedAt: "2026-10-02T10:00:00Z",
      status: "COMPLETED",
      workDone: "Test diagnosis and repair",
      representative: "Synthetic representative",
      acknowledgement: "Test acknowledged",
    },
    engineer,
  );
  expect(v.status).toBe("COMPLETED");
  expect(
    (
      await db.serviceTicket.findUniqueOrThrow({ where: { id: ticketId } })
    ).firstVisitAt?.toISOString(),
  ).toBe("2026-10-02T08:30:00.000Z");
  await expect(
    save(
      "ticket-visits",
      { ticketId, engineerId: admin.id, scheduledAt: "2026-10-02" },
      admin,
    ),
  ).rejects.toThrow("assigned");
  await expect(
    save(
      "ticket-visits",
      {
        ticketId,
        engineerId: engineer.id,
        scheduledAt: "2026-10-02",
        startedAt: "2026-10-02",
        completedAt: "2026-10-01",
        status: "COMPLETED",
        workDone: "Invalid dates",
      },
      engineer,
    ),
  ).rejects.toThrow("Completion");
});
it("keeps stock ledger immutable, consumes parts in service, blocks overspending and rolls back duplicate requests", async () => {
  partId = String(
    (
      await save(
        "parts",
        {
          sku: `PART-${suffix}`,
          name: "Synthetic spare",
          manufacturerId,
          reorderLevel: 1,
          unitCost: "10.01",
        },
        admin,
      )
    ).id,
  );
  const transaction = (type: string, quantity: number, extra: object = {}) =>
    save(
      "inventory",
      {
        partId,
        type,
        quantity,
        transactionDate: "2026-10-02T09:00:00Z",
        requestId: crypto.randomUUID(),
        ...extra,
      },
      admin,
    );
  await transaction("IN", 5);
  await transaction("RESERVE", 3, { ticketId, engineerId: engineer.id });
  await expect(transaction("OUT", 3)).rejects.toThrow("Insufficient");
  const used = await transaction("USED_IN_SERVICE", 2, {
    ticketId,
    engineerId: engineer.id,
    fromReserved: true,
  });
  expect(used.onHandAfter).toBe(3);
  expect(used.reservedAfter).toBe(1);
  await expect(
    save(
      "inventory",
      {
        partId,
        type: "IN",
        quantity: 10,
        transactionDate: "2026-10-02",
        requestId: used.requestId,
      },
      admin,
    ),
  ).rejects.toThrow();
  expect(
    (await db.sparePart.findUniqueOrThrow({ where: { id: partId } })).onHand,
  ).toBe(3);
  await expect(
    save(
      "inventory",
      {
        partId,
        type: "OUT",
        quantity: 1,
        transactionDate: "2026-10-02",
        requestId: crypto.randomUUID(),
      },
      admin,
      String(used.id),
    ),
  ).rejects.toThrow("immutable");
  await transaction("RELEASE", 1);
  await expect(transaction("OUT", 4)).rejects.toThrow("negative");
  await expect(
    save(
      "inventory",
      {
        partId,
        type: "ADJUSTMENT",
        quantity: -1,
        notes: "Test",
        transactionDate: "2026-10-02",
        requestId: crypto.randomUUID(),
      },
      engineer,
    ),
  ).rejects.toThrow("adjustment permission");
  await transaction("ADJUSTMENT", -4, {
    notes: "Explicit synthetic reconciliation",
    allowNegative: true,
  });
  expect(
    (await db.sparePart.findUniqueOrThrow({ where: { id: partId } })).onHand,
  ).toBe(-1);
  const part = await db.sparePart.findUniqueOrThrow({ where: { id: partId } });
  expect(safeRecord("parts", part, engineer)).not.toHaveProperty("unitCost");
  await expect(
    save(
      "parts",
      { sku: part.sku, name: part.name, unitCost: "5" },
      engineer,
      partId,
    ),
  ).rejects.toThrow("Pricing");
  await transaction("IN", 2);
  const t = await db.serviceTicket.findUniqueOrThrow({
    where: { id: ticketId },
  });
  await save(
    "tickets",
    {
      number: t.number,
      customerId,
      equipmentId,
      manufacturerId,
      serialNumber: t.serialNumber,
      productName: t.productName,
      issue: t.issue,
      reportedAt: t.reportedAt,
      assignedToId: engineer.id,
      status: "RESOLVED",
      resolution: "Actual test repair completed",
      resolvedAt: "2026-10-03T10:00:00Z",
    },
    admin,
    ticketId,
  );
  expect(
    await db.inventoryTransaction.count({ where: { ticketId } }),
  ).toBeGreaterThan(1);
});
it("creates one deterministic AMC opportunity without invented value, excludes active coverage and checks consumable compatibility", async () => {
  await refreshAmcOpportunities(admin.id, new Date("2026-10-07"));
  await refreshAmcOpportunities(admin.id, new Date("2026-10-07"));
  expect(await db.amcOpportunity.count({ where: { equipmentId } })).toBe(1);
  expect(
    (await db.amcOpportunity.findFirstOrThrow({ where: { equipmentId } }))
      .estimatedValue,
  ).toBeNull();
  const consumable = await save(
    "consumables",
    { sku: `C-${suffix}`, name: "Synthetic compatible accessory" },
    admin,
  );
  await expect(
    save(
      "consumable-opportunities",
      { customerId, equipmentId, consumableId: consumable.id },
      admin,
    ),
  ).rejects.toThrow("compatibility");
  await save(
    "compatibility",
    { productId, consumableId: consumable.id },
    admin,
  );
  const opportunity = await save(
    "consumable-opportunities",
    {
      customerId,
      equipmentId,
      consumableId: consumable.id,
      lastSale: "2026-09-01",
      lastQuantity: 2,
      nextFollowUp: "2026-10-07",
    },
    admin,
  );
  expect(opportunity.status).toBe("NEW");
  const activeEquipment = await save(
    "equipment",
    {
      serialNumber: `ACTIVE-${suffix}`,
      customerId,
      productName: "Synthetic active device",
      historical: true,
    },
    admin,
  );
  await save(
    "amcs",
    {
      number: `AMC-${suffix}`,
      customerId,
      equipmentIds: [activeEquipment.id],
      startDate: "2026-01-01",
      endDate: "2027-10-01",
      amount: "100",
      serviceFrequencyMonths: 3,
      status: "ACTIVE",
    },
    admin,
  );
  await refreshAmcOpportunities(admin.id, new Date("2026-10-07"));
  expect(
    await db.amcOpportunity.count({
      where: { equipmentId: String(activeEquipment.id) },
    }),
  ).toBe(0);
});
it("serializes concurrent stock issues so both requests cannot overspend the same balance", async () => {
  const p = await save(
    "parts",
    { sku: `RACE-${suffix}`, name: "Synthetic concurrent stock" },
    admin,
  );
  await save(
    "inventory",
    {
      partId: p.id,
      type: "IN",
      quantity: 3,
      transactionDate: new Date(),
      requestId: crypto.randomUUID(),
    },
    admin,
  );
  const results = await Promise.allSettled(
    [1, 2].map(() =>
      save(
        "inventory",
        {
          partId: p.id,
          type: "OUT",
          quantity: 2,
          transactionDate: new Date(),
          requestId: crypto.randomUUID(),
        },
        admin,
      ),
    ),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(
    (await db.sparePart.findUniqueOrThrow({ where: { id: String(p.id) } }))
      .onHand,
  ).toBe(1);
  expect(
    await db.inventoryTransaction.count({
      where: { partId: String(p.id), type: "OUT" },
    }),
  ).toBe(1);
});

it("retires generated uncovered opportunities when actual AMC coverage is registered", async () => {
  const e = await save(
    "equipment",
    {
      serialNumber: `COVERED-${suffix}`,
      customerId,
      productName: "Synthetic newly covered device",
      historical: true,
    },
    admin,
  );
  await refreshAmcOpportunities(admin.id, new Date("2026-10-07"));
  expect(
    await db.amcOpportunity.count({
      where: { equipmentId: String(e.id), status: "NEW" },
    }),
  ).toBe(1);
  await save(
    "amcs",
    {
      number: `COVERED-AMC-${suffix}`,
      customerId,
      equipmentIds: [e.id],
      startDate: "2026-01-01",
      endDate: "2027-10-01",
      amount: "100",
      serviceFrequencyMonths: 3,
      status: "ACTIVE",
    },
    admin,
  );
  await refreshAmcOpportunities(admin.id, new Date("2026-10-07"));
  expect(
    await db.amcOpportunity.count({
      where: { equipmentId: String(e.id), status: "NEW" },
    }),
  ).toBe(0);
  expect(
    await db.amcOpportunity.count({
      where: { equipmentId: String(e.id), status: "NOT_APPLICABLE" },
    }),
  ).toBe(1);
});
