import { afterAll, beforeAll, expect, it } from "vitest";
import { db } from "@/lib/db";
import { save } from "@/lib/service";
import { hashPassword, type Actor } from "@/lib/auth";
import { safeRecord } from "@/lib/record-query";
import { managementReport } from "@/lib/management";

let admin: Actor;
let customerId: string;
let manufacturerId: string;
let productId: string;
let otherProductId: string;
const suffix = crypto.randomUUID();

beforeAll(async () => {
  admin = await db.user.create({
    data: {
      email: `audit-${suffix}@example.test`,
      name: "Synthetic business audit administrator",
      role: "ADMIN",
      passwordHash: hashPassword("synthetic-test-password"),
    },
    include: { permissions: true },
  });
  customerId = String(
    (await save("customers", { name: `Audit customer ${suffix}` }, admin)).id,
  );
  manufacturerId = String(
    (await save("manufacturers", { name: `Audit maker ${suffix}` }, admin)).id,
  );
  productId = String(
    (
      await save(
        "products",
        { name: `Audit product ${suffix}`, model: "A", manufacturerId },
        admin,
      )
    ).id,
  );
  otherProductId = String(
    (
      await save(
        "products",
        { name: `Other product ${suffix}`, model: "B", manufacturerId },
        admin,
      )
    ).id,
  );
});
afterAll(async () => db.$disconnect());

it("retains confirmed order and receipt events after downstream serial registration", async () => {
  const input = {
    number: `AUDIT-PO-${suffix}`,
    customerId,
    poDate: "2026-01-01",
    confirmed: true,
    historical: true,
    items: [
      {
        equipment: "Synthetic delivered device",
        productId,
        manufacturerId,
        quantity: 2,
        unitPrice: "100",
        taxRate: "0",
      },
    ],
  };
  const order = await save("orders", input, admin);
  const orderItemId = (order.items as { id: string }[])[0].id;
  const dispatch = {
    orderId: order.id,
    dispatchDate: "2026-01-02",
    actualDate: "2026-01-03",
    location: "Synthetic test institution",
    confirmed: true,
    items: [{ orderItemId, quantity: 2 }],
  };
  const delivery = await save("deliveries", dispatch, admin);
  await expect(
    save("orders", { ...input, confirmed: false }, admin, String(order.id)),
  ).rejects.toThrow("confirmation is locked");
  const serial = {
    serialNumber: `AUDIT-SERIAL-${suffix}`,
    customerId,
    orderId: order.id,
    orderItemId,
    deliveryId: delivery.id,
  };
  await expect(
    save("equipment", { ...serial, productId: otherProductId }, admin),
  ).rejects.toThrow("delivered order item");
  const equipment = await save("equipment", serial, admin);
  expect(equipment.productId).toBe(productId);
  expect(equipment.manufacturerId).toBe(manufacturerId);
  await expect(
    save(
      "deliveries",
      { ...dispatch, confirmed: false },
      admin,
      String(delivery.id),
    ),
  ).rejects.toThrow("locked after serial registration");
  await expect(
    save(
      "deliveries",
      { ...dispatch, actualDate: "2026-02-03" },
      admin,
      String(delivery.id),
    ),
  ).rejects.toThrow("locked after serial registration");
  await save(
    "deliveries",
    { ...dispatch, notes: "Actual transport reference retained" },
    admin,
    String(delivery.id),
  );
  expect(
    (
      await db.delivery.findUniqueOrThrow({
        where: { id: String(delivery.id) },
      })
    ).actualDate
      ?.toISOString()
      .slice(0, 10),
  ).toBe("2026-01-03");
});

it("validates a supplied equipment product when an order item has no product link", async () => {
  const otherManufacturer = await save(
    "manufacturers",
    { name: `Other maker ${suffix}` },
    admin,
  );
  const wrongProduct = await save(
    "products",
    {
      name: `Wrong maker product ${suffix}`,
      model: "C",
      manufacturerId: otherManufacturer.id,
    },
    admin,
  );
  const order = await save(
    "orders",
    {
      number: `AUDIT-UNLINKED-PO-${suffix}`,
      customerId,
      poDate: "2026-01-01",
      confirmed: true,
      historical: true,
      items: [
        {
          equipment: "Synthetic unlinked product",
          manufacturerId,
          quantity: 1,
          unitPrice: "100",
          taxRate: "0",
        },
      ],
    },
    admin,
  );
  const orderItemId = (order.items as { id: string }[])[0].id;
  const delivery = await save(
    "deliveries",
    {
      orderId: order.id,
      location: "Test",
      confirmed: true,
      actualDate: "2026-01-02",
      items: [{ orderItemId, quantity: 1 }],
    },
    admin,
  );
  await expect(
    save(
      "equipment",
      {
        serialNumber: `AUDIT-WRONG-MAKER-${suffix}`,
        customerId,
        orderId: order.id,
        orderItemId,
        deliveryId: delivery.id,
        productId: wrongProduct.id,
      },
      admin,
    ),
  ).rejects.toThrow("Product and manufacturer do not match");
  expect(
    await db.equipment.count({ where: { deliveryId: String(delivery.id) } }),
  ).toBe(0);
});

it("keeps completed AMC visits immutable and schedules from the latest actual completion", async () => {
  const equipment = await save(
    "equipment",
    {
      serialNumber: `AUDIT-LEGACY-${suffix}`,
      customerId,
      productName: "Actual historical device",
      historical: true,
    },
    admin,
  );
  const contractInput = {
    customerId,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    amount: "100",
    serviceFrequencyMonths: 3,
    equipmentIds: [equipment.id],
  };
  const contract = await save(
    "amcs",
    { ...contractInput, number: `AUDIT-AMC-${suffix}` },
    admin,
  );
  const other = await save(
    "amcs",
    { ...contractInput, number: `AUDIT-OTHER-AMC-${suffix}` },
    admin,
  );
  const visitInput = {
    amcId: contract.id,
    scheduledDate: "2026-07-01",
    completedDate: "2026-07-01",
    status: "COMPLETED",
  };
  const completed = await save("visits", visitInput, admin);
  await save(
    "visits",
    {
      ...visitInput,
      scheduledDate: "2026-04-01",
      completedDate: "2026-04-01",
      historical: true,
    },
    admin,
  );
  expect(
    (
      await db.amcContract.findUniqueOrThrow({
        where: { id: String(contract.id) },
      })
    ).nextServiceDate
      ?.toISOString()
      .slice(0, 10),
  ).toBe("2026-10-01");
  await expect(
    save(
      "visits",
      { ...visitInput, status: "SCHEDULED", completedDate: null },
      admin,
      String(completed.id),
    ),
  ).rejects.toThrow("immutable");
  const scheduled = await save(
    "visits",
    { amcId: contract.id, scheduledDate: "2026-10-01" },
    admin,
  );
  await expect(
    save(
      "visits",
      { amcId: other.id, scheduledDate: "2026-10-01" },
      admin,
      String(scheduled.id),
    ),
  ).rejects.toThrow("another contract");
});

it("rejects payment follow-ups before contact and inactive assigned employees", async () => {
  const invoice = await save(
    "invoices",
    {
      number: `AUDIT-INV-${suffix}`,
      customerId,
      invoiceDate: "2026-01-01",
      amount: "100",
      taxAmount: "0",
      paymentTermDays: 30,
      historical: true,
    },
    admin,
  );
  const input = {
    invoiceId: invoice.id,
    contactDate: "2026-01-05",
    notes: "Synthetic invoice follow-up",
  };
  await expect(
    save("followups", { ...input, nextDate: "2026-01-04" }, admin),
  ).rejects.toThrow("precede contact");
  const inactive = await db.user.create({
    data: {
      email: `inactive-${suffix}@example.test`,
      name: "Synthetic inactive employee",
      passwordHash: "not-a-login-hash",
      active: false,
    },
  });
  await expect(
    save(
      "followups",
      { ...input, nextDate: "2026-01-06", employeeId: inactive.id },
      admin,
    ),
  ).rejects.toThrow("active employee");
  await save(
    "followups",
    { ...input, nextDate: "2026-01-06", employeeId: admin.id },
    admin,
  );
});

it("returns a successfully saved large invoice without failing while calculating its balance", async () => {
  const invoice = await save(
    "invoices",
    {
      number: `AUDIT-LARGE-INV-${suffix}`,
      customerId,
      invoiceDate: "2026-01-01",
      amount: "999999999999",
      taxAmount: "999999999999",
      paymentTermDays: 30,
      historical: true,
    },
    admin,
  );
  expect(safeRecord("invoices", invoice, admin)).toMatchObject({
    adjustedTotal: "1999999999998.00",
    outstanding: "1999999999998.00",
  });
});

it("counts matching orders while limiting manufacturer value to the selected product lines", async () => {
  const customer = await save(
    "customers",
    { name: `Filtered report customer ${suffix}` },
    admin,
  );
  await save(
    "orders",
    {
      number: `AUDIT-MIXED-PRODUCT-PO-${suffix}`,
      customerId: customer.id,
      poDate: "2026-01-01",
      confirmed: true,
      historical: true,
      items: [
        {
          equipment: "Selected product",
          productId,
          manufacturerId,
          quantity: 2,
          unitPrice: "100",
          taxRate: "0",
        },
        {
          equipment: "Other product on the same order",
          productId: otherProductId,
          manufacturerId,
          quantity: 1,
          unitPrice: "900",
          taxRate: "0",
        },
      ],
    },
    admin,
  );
  const report = await managementReport(
    admin,
    new URLSearchParams({ customerId: String(customer.id), productId }),
  );
  expect(report.cards.activeOrders).toBe(1);
  expect(
    report.manufacturers.find(
      (row) => row.manufacturer === `Audit maker ${suffix}`,
    ),
  ).toMatchObject({ orderValue: "200.00" });
  expect(report.productMetrics).toEqual([
    expect.objectContaining({ orderValue: "200.00", unitsSold: 2 }),
  ]);
});
