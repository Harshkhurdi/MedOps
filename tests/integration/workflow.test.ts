import { beforeAll, afterAll, it, expect } from "vitest";
import { db } from "@/lib/db";
import { save } from "@/lib/service";
import { hashPassword, type Actor } from "@/lib/auth";
import { runReminders } from "@/lib/reminders";
import { store, retrieve } from "@/lib/storage";
let admin: Actor;
beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes("/medops_test"))
    throw new Error("Unsafe database");
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "User", "CompanyProfile", "Customer", "Manufacturer", "DocumentTemplate" CASCADE',
  );
  admin = await db.user.create({
    data: {
      email: "admin@example.test",
      name: "Synthetic Administrator",
      passwordHash: hashPassword("synthetic-test-password"),
      role: "ADMIN",
    },
    include: { permissions: true },
  });
});
afterAll(async () => {
  await db.$disconnect();
});
it("persists the complete tender, order, partial delivery, warranty, AMC and payment workflow", async () => {
  const company = await save(
    "company",
    {
      legalName: "Synthetic Test Co",
      address: "Local test fixture",
      signatory: "Synthetic Signatory",
      reminderDays: 30,
    },
    admin,
  );
  expect(company.legalName).toBe("Synthetic Test Co");
  const customer = await save(
    "customers",
    { name: "Synthetic Test Institution", state: "Maharashtra" },
    admin,
  );
  const manufacturer = await save(
    "manufacturers",
    { name: "Synthetic Test Manufacturer" },
    admin,
  );
  const tender = await save(
    "tenders",
    {
      number: "SYNTHETIC-TEST-001",
      customerId: customer.id,
      deadline: "2026-10-10T10:00:00Z",
      status: "DRAFT",
      items: [
        {
          equipment: "Test device",
          model: "T1",
          manufacturerId: manufacturer.id,
          quantity: 2,
        },
      ],
    },
    admin,
  );
  await expect(
    save(
      "tenders",
      {
        number: "SYNTHETIC-TEST-001",
        customerId: customer.id,
        status: "READY_FOR_SUBMISSION",
        items: [{ equipment: "Test device", quantity: 2 }],
      },
      admin,
      String(tender.id),
    ),
  ).rejects.toThrow("Review");
  const won = await save(
    "tenders",
    {
      number: "SYNTHETIC-TEST-001",
      customerId: customer.id,
      status: "WON",
      items: [
        {
          equipment: "Test device",
          model: "T1",
          manufacturerId: manufacturer.id,
          quantity: 2,
        },
      ],
    },
    admin,
    String(tender.id),
  );
  expect(won.status).toBe("WON");
  expect(
    await db.tenderStatusHistory.count({
      where: { tenderId: String(tender.id) },
    }),
  ).toBe(2);
  const orderInput = {
    number: "TEST-PO-001",
    tenderId: tender.id,
    customerId: customer.id,
    poDate: "2026-01-01",
    deliveryDeadline: "2026-10-11",
    items: [
      {
        equipment: "Test device",
        model: "T1",
        manufacturerId: manufacturer.id,
        quantity: 2,
        unitPrice: "100.00",
        taxRate: "18",
      },
    ],
  };
  const order = await save("orders", orderInput, admin);
  expect(String(order.total)).toBe("236");
  await expect(
    save("orders", { ...orderInput, confirmed: true }, admin, String(order.id)),
  ).rejects.toThrow("official");
  const stored = await store(
    Buffer.from("%PDF-1.7\nSynthetic test only"),
    "application/pdf",
    ".pdf",
  );
  expect((await retrieve(stored.key)).toString()).toContain("Synthetic");
  await db.storedFile.create({
    data: {
      ...stored,
      module: "orders",
      recordId: String(order.id),
      orderId: String(order.id),
      name: "official-test.pdf",
      mime: "application/pdf",
      size: 32,
    },
  });
  const confirmed = await save(
    "orders",
    { ...orderInput, confirmed: true },
    admin,
    String(order.id),
  );
  const line = (confirmed.items as { id: string }[])[0];
  const dispatchInput = {
    orderId: order.id,
    dispatchDate: "2026-01-02",
    actualDate: "2026-01-03",
    location: "Synthetic test location",
    confirmed: true,
    items: [{ orderItemId: line.id, quantity: 1 }],
  };
  const delivery = await save("deliveries", dispatchInput, admin);
  expect(
    (
      await db.purchaseOrder.findUniqueOrThrow({
        where: { id: String(order.id) },
      })
    ).status,
  ).toBe("PARTIALLY_DELIVERED");
  await expect(
    save(
      "deliveries",
      { ...dispatchInput, items: [{ orderItemId: line.id, quantity: 2 }] },
      admin,
    ),
  ).rejects.toThrow("balance");
  const unit = await save(
    "equipment",
    {
      serialNumber: "TEST-SERIAL-001",
      orderId: order.id,
      orderItemId: line.id,
      deliveryId: delivery.id,
      customerId: customer.id,
    },
    admin,
  );
  await expect(
    save(
      "equipment",
      {
        serialNumber: "TEST-SERIAL-002",
        orderId: order.id,
        orderItemId: line.id,
        deliveryId: delivery.id,
        customerId: customer.id,
      },
      admin,
    ),
  ).rejects.toThrow("serial");
  await expect(
    save(
      "warranties",
      {
        equipmentId: unit.id,
        commencement: "INSTALLATION",
        durationMonths: 12,
        terms: "Synthetic terms",
      },
      admin,
    ),
  ).rejects.toThrow("commencement");
  await save(
    "installations",
    {
      equipmentId: unit.id,
      status: "ACCEPTED",
      installationDate: "2026-01-04",
      commissioningDate: "2026-01-05",
      acceptanceDate: "2026-01-06",
    },
    admin,
  );
  const warranty = await save(
    "warranties",
    {
      equipmentId: unit.id,
      commencement: "ACCEPTANCE",
      durationMonths: 12,
      terms: "Synthetic terms",
    },
    admin,
  );
  expect((warranty.startDate as Date).toISOString().slice(0, 10)).toBe(
    "2026-01-06",
  );
  expect((warranty.endDate as Date).toISOString().slice(0, 10)).toBe(
    "2027-01-06",
  );
  const amcInput = {
    number: "TEST-AMC-001",
    customerId: customer.id,
    startDate: "2026-01-07",
    endDate: "2026-12-31",
    amount: "10.00",
    serviceFrequencyMonths: 3,
    nextServiceDate: "2026-04-07",
    equipmentIds: [unit.id],
  };
  const amc = await save("amcs", amcInput, admin);
  await save(
    "visits",
    {
      amcId: amc.id,
      scheduledDate: "2026-04-07",
      completedDate: "2026-04-07",
      status: "COMPLETED",
    },
    admin,
  );
  expect(
    (await db.amcContract.findUniqueOrThrow({ where: { id: String(amc.id) } }))
      .nextServiceDate!.toISOString()
      .slice(0, 10),
  ).toBe("2026-07-07");
  await expect(
    save(
      "amcs",
      {
        ...amcInput,
        number: "TEST-AMC-BAD",
        nextServiceDate: "2027-04-01",
        renewedFromId: amc.id,
        startDate: "2026-12-01",
        endDate: "2027-12-31",
      },
      admin,
    ),
  ).rejects.toThrow("Renewal");
  await save(
    "amcs",
    {
      ...amcInput,
      number: "TEST-AMC-RENEWED",
      renewedFromId: amc.id,
      startDate: "2027-01-01",
      endDate: "2027-12-31",
      nextServiceDate: "2027-04-01",
    },
    admin,
  );
  const invoice = await save(
    "invoices",
    {
      number: "TEST-INV-001",
      orderId: order.id,
      customerId: customer.id,
      invoiceDate: "2026-01-10",
      amount: "100.00",
      taxAmount: "18.00",
      paymentTermDays: 30,
    },
    admin,
  );
  expect((invoice.dueDate as Date).toISOString().slice(0, 10)).toBe(
    "2026-02-09",
  );
  await save(
    "payments",
    {
      invoiceId: invoice.id,
      amount: "50.00",
      paymentDate: "2026-01-20",
      reference: "TEST-RECEIPT-1",
      method: "BANK_TRANSFER",
    },
    admin,
  );
  await expect(
    save(
      "payments",
      {
        invoiceId: invoice.id,
        amount: "70.00",
        paymentDate: "2026-01-20",
        reference: "TEST-EXCESS",
        method: "BANK_TRANSFER",
      },
      admin,
    ),
  ).rejects.toThrow("balance");
  const concurrent = await Promise.allSettled(
    [1, 2].map((n) =>
      save(
        "payments",
        {
          invoiceId: invoice.id,
          amount: "40.00",
          paymentDate: "2026-01-21",
          reference: `TEST-CONCURRENT-${n}`,
          method: "BANK_TRANSFER",
        },
        admin,
      ),
    ),
  );
  expect(concurrent.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const receipts = await db.payment.findMany({
    where: { invoiceId: String(invoice.id) },
  });
  expect(receipts.reduce((s, p) => s + Number(p.amount), 0)).toBe(90);
  await save(
    "followups",
    {
      invoiceId: invoice.id,
      contactDate: "2026-09-30",
      nextDate: "2026-10-01",
      notes: "Synthetic follow-up",
    },
    admin,
  );
  const first = await runReminders(new Date("2026-10-07"));
  expect(first.notifications).toBeGreaterThan(0);
  const count = await db.notification.count();
  await runReminders(new Date("2026-10-07"));
  expect(await db.notification.count()).toBe(count);
  expect(await db.auditLog.count()).toBeGreaterThan(10);
  const second = await save("deliveries", dispatchInput, admin);
  expect(second.id).toBeTruthy();
  expect(
    (
      await db.purchaseOrder.findUniqueOrThrow({
        where: { id: String(order.id) },
      })
    ).status,
  ).toBe("DELIVERED");
});
