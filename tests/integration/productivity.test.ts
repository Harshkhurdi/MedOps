import { beforeAll, afterAll, it, expect } from "vitest";
import { db } from "@/lib/db";
import { hashPassword, type Actor } from "@/lib/auth";
import { save } from "@/lib/service";
import { previewImport, confirmImport } from "@/lib/imports";
import { universalSearch } from "@/lib/search";
import { todaysBrief } from "@/lib/brief";
import { accountingRows } from "@/lib/accounting";
import { recordWhere } from "@/lib/record-query";
let admin: Actor, restricted: Actor, customerId: string;
const suffix = Date.now();
beforeAll(async () => {
  admin = await db.user.create({
    data: {
      name: "Synthetic productivity administrator",
      email: `productivity-${suffix}@example.test`,
      role: "ADMIN",
      passwordHash: hashPassword("synthetic-test-password"),
    },
    include: { permissions: true },
  });
  restricted = {
    ...admin,
    role: "EMPLOYEE",
    permissions: [
      {
        id: "p",
        userId: admin.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        module: "customers",
        read: true,
        write: false,
      },
    ],
  };
  customerId = String(
    (
      await save(
        "customers",
        { name: `Unique Search Hospital ${suffix}` },
        admin,
      )
    ).id,
  );
});
afterAll(async () => db.$disconnect());
it("previews without creating records, confirms valid rows, reports errors and is idempotent", async () => {
  const name = `Imported synthetic ${suffix}`;
  const batch = await previewImport(admin, {
    module: "customers",
    headers: ["name", "originalDate"],
    rows: [
      [name, "2010-01-01"],
      [name, "2010-01-01"],
      ["", "bad"],
    ],
    mapping: { name: "name", originalDate: "originalDate" },
  });
  expect(batch.preview.map((r) => r.status)).toEqual([
    "VALID",
    "REJECTED",
    "REJECTED",
  ]);
  expect(await db.customer.count({ where: { name } })).toBe(0);
  const report = await confirmImport(admin, batch.id);
  expect(report.importedCount).toBe(1);
  expect(report.rejectedCount).toBe(2);
  expect(
    (await db.customer.findFirstOrThrow({ where: { name } })).originalDate
      ?.toISOString()
      .slice(0, 10),
  ).toBe("2010-01-01");
  expect(await confirmImport(admin, batch.id)).toEqual(report);
  await expect(
    previewImport(restricted, {
      module: "customers",
      headers: ["name"],
      rows: [["Deny"]],
      mapping: { name: "name" },
    }),
  ).rejects.toThrow(/administrator/);
});
it("revalidates at confirmation and reports concurrent duplicates explicitly", async () => {
  const name = `Duplicate synthetic ${suffix}`;
  const batch = await previewImport(admin, {
    module: "manufacturers",
    headers: ["name"],
    rows: [[name]],
    mapping: { name: "name" },
  });
  await save("manufacturers", { name }, admin);
  expect((await confirmImport(admin, batch.id)).rows[0]).toMatchObject({
    status: "REJECTED",
    error: "Duplicate record",
  });
});
it("searches actual serials and contacts while excluding unauthorized registers and credentials", async () => {
  const device = await save(
    "equipment",
    {
      customerId,
      serialNumber: `Search-Serial-${suffix}`,
      productName: "Synthetic search device",
      historical: true,
      originalDate: "2010-01-01",
    },
    admin,
  );
  await save(
    "customer-contacts",
    { customerId, name: `Search-Contact-${suffix}` },
    admin,
  );
  const serial = await universalSearch(admin, `Search-Serial-${suffix}`);
  expect(serial[0].results[0].id).toBe(device.id);
  expect(await universalSearch(restricted, `Search-Serial-${suffix}`)).toEqual(
    [],
  );
  const c = await universalSearch(
    restricted,
    `Unique Search Hospital ${suffix}`,
  );
  expect(c[0].entity).toBe("customers");
  expect(
    JSON.stringify(await universalSearch(admin, admin.email)),
  ).not.toContain("passwordHash");
});
it("builds a permission-aware daily brief with real balances, India day boundaries and filters", async () => {
  const now = new Date("2026-10-07T03:00:00Z");
  const ticket = await save(
    "tickets",
    {
      number: `Brief-critical-${suffix}`,
      customerId,
      productName: "Synthetic device",
      issue: "Synthetic issue",
      priority: "CRITICAL",
      reportedAt: "2026-10-06T09:00:00Z",
      status: "ASSIGNED",
      assignedToId: admin.id,
    },
    admin,
  );
  await save(
    "tickets",
    {
      number: `Brief-critical-${suffix}`,
      customerId,
      productName: "Synthetic device",
      issue: "Synthetic issue",
      priority: "CRITICAL",
      reportedAt: "2026-10-06T09:00:00Z",
      status: "WAITING_FOR_PARTS",
      assignedToId: admin.id,
    },
    admin,
    String(ticket.id),
  );
  await save(
    "ticket-visits",
    {
      ticketId: ticket.id,
      engineerId: admin.id,
      scheduledAt: "2026-10-06T20:00:00Z",
    },
    admin,
  );
  const invoice = await save(
    "invoices",
    {
      number: `Brief-invoice-${suffix}`,
      customerId,
      invoiceDate: "2026-01-01",
      amount: "10",
      taxAmount: "0",
      paymentTermDays: 30,
      historical: true,
    },
    admin,
  );
  await save(
    "payments",
    {
      invoiceId: invoice.id,
      amount: "10",
      paymentDate: "2026-02-01",
      reference: "Synthetic paid",
      method: "CASH",
    },
    admin,
  );
  const all = await todaysBrief(admin, new URLSearchParams(), now);
  expect(
    all.some((a) => a.id === ticket.id && a.action === "Awaiting parts"),
  ).toBe(true);
  expect(
    all.some(
      (a) =>
        a.label === `Brief-critical-${suffix}` && a.action === "Today's visit",
    ),
  ).toBe(true);
  expect(all.some((a) => a.id === invoice.id)).toBe(false);
  const filtered = await todaysBrief(
    admin,
    new URLSearchParams({
      module: "tickets",
      priority: "HIGH",
      employeeId: admin.id,
    }),
    now,
  );
  expect(filtered.some((a) => a.id === ticket.id)).toBe(true);
  expect(
    filtered.every((a) => a.module === "tickets" && a.employeeId === admin.id),
  ).toBe(true);
  expect(await todaysBrief(restricted, new URLSearchParams(), now)).toEqual([]);
});
it("exports clean accounting records and applies supported register filters", async () => {
  expect(
    (
      await accountingRows(
        admin,
        "customers",
        new URLSearchParams({ q: `Unique Search Hospital ${suffix}` }),
      )
    )[0].id,
  ).toBe(customerId);
  await expect(
    accountingRows(restricted, "invoices", new URLSearchParams()),
  ).rejects.toThrow(/access/);
  expect(
    await recordWhere(
      "orders",
      admin,
      new URLSearchParams({ manufacturerId: "m", from: "2026-01-01" }),
    ),
  ).toMatchObject({
    items: { some: { manufacturerId: "m" } },
    poDate: { gte: new Date("2026-01-01") },
  });
});

it("includes due commercial, delivery, AMC and financial actions and retires completed obligations", async () => {
  const now = new Date("2026-10-07T03:00:00Z");
  const manufacturer = await save(
    "manufacturers",
    { name: `Brief manufacturer ${suffix}` },
    admin,
  );
  const tender = await save(
    "tenders",
    { number: `Brief tender ${suffix}`, customerId, deadline: "2026-10-09" },
    admin,
  );
  const rfq = await save(
    "rfqs",
    {
      number: `Brief RFQ ${suffix}`,
      manufacturerId: manufacturer.id,
      customerId,
      productName: "Synthetic",
      quantity: 1,
      historical: true,
      status: "SENT",
      sentAt: "2026-10-01",
    },
    admin,
  );
  const followup = await save(
    "rfq-followups",
    {
      rfqId: rfq.id,
      contactDate: "2026-10-01",
      nextDate: "2026-10-07",
      notes: "Synthetic follow up",
    },
    admin,
  );
  const quote = await save(
    "quotes",
    {
      number: `Brief quote ${suffix}`,
      manufacturerId: manufacturer.id,
      productName: "Synthetic",
      quantity: 1,
      quotationDate: "2026-10-01",
      validityDate: "2026-10-10",
      unitPrice: "10",
      historical: true,
    },
    admin,
  );
  const sec = await save(
    "securities",
    {
      customerId,
      reference: `Brief security ${suffix}`,
      type: "PBG",
      amount: "10",
      issueDate: "2026-10-01",
      validityDate: "2026-10-09",
      expectedRefundDate: "2026-10-07",
      status: "ISSUED",
    },
    admin,
  );
  const order = await save(
    "orders",
    {
      number: `Brief order ${suffix}`,
      customerId,
      poDate: "2026-10-01",
      deliveryDeadline: "2026-10-08",
      confirmed: true,
      historical: true,
      items: [
        { equipment: "Synthetic", quantity: 1, unitPrice: "100", taxRate: "0" },
      ],
    },
    admin,
  );
  const device = await save(
    "equipment",
    {
      customerId,
      serialNumber: `Brief-amc-device-${suffix}`,
      productName: "Synthetic",
      historical: true,
    },
    admin,
  );
  const amc = await save(
    "amcs",
    {
      number: `Brief AMC ${suffix}`,
      customerId,
      startDate: "2025-12-01",
      endDate: "2026-12-01",
      amount: "10",
      status: "ACTIVE",
      serviceFrequencyMonths: 3,
      historical: true,
      equipmentIds: [device.id],
    },
    admin,
  );
  const invoice = await save(
    "invoices",
    {
      number: `Brief overdue ${suffix}`,
      customerId,
      invoiceDate: "2026-09-01",
      amount: "10",
      taxAmount: "0",
      paymentTermDays: 1,
      historical: true,
    },
    admin,
  );
  const paymentFollowup = await save(
    "followups",
    {
      invoiceId: invoice.id,
      contactDate: "2026-09-02",
      nextDate: "2026-10-07",
      notes: "Synthetic balance follow up",
    },
    admin,
  );
  let actions = await todaysBrief(admin, new URLSearchParams(), now);
  for (const [module, row] of [
    ["tenders", tender],
    ["rfq-followups", followup],
    ["quotes", quote],
    ["orders", order],
    ["amcs", amc],
    ["invoices", invoice],
    ["followups", paymentFollowup],
  ] as const)
    expect(
      actions.some((a) => a.module === module && a.id === row.id),
      module,
    ).toBe(true);
  expect(
    actions.filter((a) => a.module === "securities" && a.id === sec.id),
  ).toHaveLength(2);
  await save(
    "payments",
    {
      invoiceId: invoice.id,
      amount: "10",
      paymentDate: "2026-10-01",
      reference: "Synthetic settlement",
      method: "BANK_TRANSFER",
    },
    admin,
  );
  await save(
    "rfqs",
    {
      number: rfq.number,
      manufacturerId: manufacturer.id,
      customerId,
      productName: "Synthetic",
      quantity: 1,
      historical: true,
      status: "CANCELLED",
      sentAt: "2026-10-01",
    },
    admin,
    String(rfq.id),
  );
  await save(
    "securities",
    {
      customerId,
      reference: sec.reference,
      type: "PBG",
      amount: "10",
      issueDate: "2026-10-01",
      validityDate: "2026-10-09",
      expectedRefundDate: "2026-10-07",
      actualRefundDate: "2026-10-07",
      status: "REFUNDED",
    },
    admin,
    String(sec.id),
  );
  actions = await todaysBrief(admin, new URLSearchParams(), now);
  expect(
    actions.some((a) =>
      [invoice.id, paymentFollowup.id, sec.id, followup.id].includes(a.id),
    ),
  ).toBe(false);
  expect(
    await todaysBrief(restricted, new URLSearchParams({ module: "amcs" }), now),
  ).toEqual([]);
});
