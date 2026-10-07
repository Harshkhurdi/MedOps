import { beforeAll, afterAll, it, expect } from "vitest";
import { db } from "@/lib/db";
import { save } from "@/lib/service";
import { hashPassword, type Actor } from "@/lib/auth";
import { managementReport } from "@/lib/management";
import { safeRecord } from "@/lib/record-query";
let admin: Actor,
  employee: Actor,
  customerId: string,
  invoiceId: string,
  paymentId: string;
const suffix = Date.now();
beforeAll(async () => {
  admin = await db.user.create({
    data: {
      name: "Synthetic revenue admin",
      email: `revenue-${suffix}@example.test`,
      role: "ADMIN",
      passwordHash: hashPassword("synthetic-test-password"),
    },
    include: { permissions: true },
  });
  employee = {
    ...admin,
    id: "restricted",
    role: "EMPLOYEE",
    permissions: [
      {
        id: "x",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "restricted",
        module: "adjustments",
        read: true,
        write: true,
      },
    ],
  };
  customerId = String(
    (
      await save(
        "customers",
        {
          name: `Synthetic CRM ${suffix}`,
          historical: true,
          originalDate: "2010-01-01",
        },
        admin,
      )
    ).id,
  );
});
afterAll(async () => db.$disconnect());
it("enters historical standalone invoices and receipts without fictitious purchase orders", async () => {
  invoiceId = String(
    (
      await save(
        "invoices",
        {
          number: `Legacy-${suffix}`,
          customerId,
          invoiceDate: "2020-01-01",
          amount: "100",
          taxAmount: "18",
          paymentTermDays: 30,
          historical: true,
          originalDate: "2020-01-01",
        },
        admin,
      )
    ).id,
  );
  await expect(
    save(
      "invoices",
      {
        number: `Normal-${suffix}`,
        customerId,
        invoiceDate: "2020-01-01",
        amount: "100",
        taxAmount: "18",
        paymentTermDays: 30,
      },
      admin,
    ),
  ).rejects.toThrow(/confirmed|order/i);
  paymentId = String(
    (
      await save(
        "payments",
        {
          invoiceId,
          amount: "50",
          paymentDate: "2020-02-01",
          reference: "Synthetic bank receipt",
          method: "BANK_TRANSFER",
          historical: true,
          originalDate: "2020-02-01",
        },
        admin,
      )
    ).id,
  );
});
it("records immutable audited credit/debit notes and partial receipt reversals", async () => {
  const base = {
    invoiceId,
    amount: "10",
    taxAmount: "1.80",
    adjustmentDate: "2020-02-02",
    reason: "Synthetic correction",
    confirmed: true,
  };
  const credit = await save(
    "adjustments",
    { ...base, type: "INVOICE_CREDIT", reference: "CREDIT" },
    admin,
  );
  await save(
    "adjustments",
    {
      ...base,
      type: "INVOICE_DEBIT",
      reference: "DEBIT",
      amount: "5",
      taxAmount: "0.90",
    },
    admin,
  );
  await save(
    "adjustments",
    {
      ...base,
      type: "PAYMENT_REVERSAL",
      paymentId,
      reference: "REVERSAL",
      amount: "15",
      taxAmount: "0",
    },
    admin,
  );
  await expect(
    save(
      "adjustments",
      { ...base, type: "INVOICE_CREDIT", reference: "EDIT" },
      admin,
      String(credit.id),
    ),
  ).rejects.toThrow(/immutable/);
  const i = await db.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { payments: true, adjustments: true },
  });
  expect(String(i.total)).toBe("118");
  expect(safeRecord("invoices", i, admin).outstanding).toBe("77.10");
  expect(
    await db.auditLog.count({
      where: { userId: admin.id, module: "adjustments", action: "CREATE" },
    }),
  ).toBe(3);
});
it("blocks overpayments, excessive reversals, cross-invoice links and unauthorized financial corrections", async () => {
  const base = {
    invoiceId,
    type: "PAYMENT_REVERSAL",
    paymentId,
    amount: "36",
    taxAmount: "0",
    adjustmentDate: "2020-02-03",
    reference: "BAD",
    reason: "Synthetic invalid",
    confirmed: true,
  };
  await expect(save("adjustments", base, admin)).rejects.toThrow(/exceeds/);
  await expect(
    save("adjustments", { ...base, amount: "1" }, employee),
  ).rejects.toThrow(/permission/);
  await expect(
    save(
      "payments",
      {
        invoiceId,
        amount: "77.11",
        paymentDate: "2020-03-01",
        reference: "overpay",
        method: "BANK_TRANSFER",
      },
      admin,
    ),
  ).rejects.toThrow(/outstanding|exceed/i);
  await expect(
    save(
      "adjustments",
      { ...base, type: "INVOICE_CREDIT", paymentId: null, amount: "1000" },
      admin,
    ),
  ).rejects.toThrow(/negative|overpayment/);
});
it("tracks contacts, actual interactions and human pipeline without inventing probabilities", async () => {
  const contact = await save(
    "customer-contacts",
    { customerId, name: "Synthetic contact", department: "Biomedical" },
    admin,
  );
  const other = String(
    (await save("customers", { name: `Wrong ${suffix}` }, admin)).id,
  );
  await expect(
    save(
      "interactions",
      {
        customerId: other,
        contactId: contact.id,
        employeeId: admin.id,
        type: "CALL",
        occurredAt: "2026-01-01",
        notes: "Test",
      },
      admin,
    ),
  ).rejects.toThrow(/Contact/);
  await save(
    "interactions",
    {
      customerId,
      contactId: contact.id,
      employeeId: admin.id,
      type: "PAYMENT",
      occurredAt: "2026-01-01",
      notes: "Synthetic payment discussion",
      relatedModule: "invoices",
      recordId: invoiceId,
      nextFollowUp: "2026-01-02",
    },
    admin,
  );
  const p = await save(
    "pipeline",
    { title: "Synthetic service sale", type: "SERVICE", customerId },
    admin,
  );
  expect(p.probability).toBeNull();
  expect(p.estimatedValue).toBeNull();
});
it("reports actual contribution with signed losses and corrected customer balances", async () => {
  await save(
    "costs",
    {
      title: "Synthetic service cost",
      category: "SERVICE",
      amount: "120",
      customerId,
      incurredDate: "2020-02-01",
      serviceCost: true,
      postSale: true,
    },
    admin,
  );
  const r = await managementReport(admin, new URLSearchParams({ customerId }));
  expect(r.profitability).toMatchObject({
    revenue: "95.00",
    recordedCosts: "120.00",
    grossContribution: "-25.00",
  });
  expect(r.customerMetrics[0].outstanding).toBe("77.10");
  expect(
    r.profitability?.groups.filter((g) => g.dimension === "customer")[0]
      .grossContribution,
  ).toBe("-25.00");
  const restricted = await managementReport(
    {
      ...employee,
      permissions: [
        {
          id: "x",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "restricted",
          module: "analytics",
          read: true,
          write: false,
        },
      ],
    },
    new URLSearchParams(),
  );
  expect(restricted.profitability).toBeNull();
  expect(restricted.customerMetrics).toHaveLength(0);
});

it("rejects an invoice dated before its actual linked purchase order", async () => {
  const order = await save(
    "orders",
    {
      number: `DATE-ORDER-${suffix}`,
      customerId,
      poDate: "2020-05-01",
      historical: true,
      confirmed: true,
      items: [
        {
          equipment: "Synthetic",
          quantity: 1,
          unitPrice: "100",
          taxRate: "18",
        },
      ],
    },
    admin,
  );
  await expect(
    save(
      "invoices",
      {
        number: `DATE-INVOICE-${suffix}`,
        orderId: order.id,
        customerId,
        invoiceDate: "2020-04-01",
        amount: "100",
        taxAmount: "18",
        paymentTermDays: 30,
        historical: true,
      },
      admin,
    ),
  ).rejects.toThrow("Invoice date cannot precede");
  expect(
    await db.invoice.count({ where: { number: `DATE-INVOICE-${suffix}` } }),
  ).toBe(0);
});

it("persists actual competitor/customer/result links without inventing unknown prices", async () => {
  const competitor = await save(
    "competitors",
    {
      company: `Synthetic competitor ${suffix}`,
      brands: "Known test brand",
      categories: "Imaging",
    },
    admin,
  );
  const link = await save(
    "competitor-customers",
    { competitorId: competitor.id, customerId, category: "Imaging" },
    admin,
  );
  expect(link.competitorId).toBe(competitor.id);
  const tender = await save(
    "tenders",
    { number: `Competitor tender ${suffix}`, customerId },
    admin,
  );
  const result = await save(
    "results",
    {
      tenderId: tender.id,
      outcome: "LOST",
      competitorId: competitor.id,
      resultDate: "2026-10-07",
      historical: true,
      reason: "Actual synthetic acceptance loss",
    },
    admin,
  );
  expect(result.competitorId).toBe(competitor.id);
  expect(result.winningPrice).toBeNull();
  expect(
    (await db.tender.findUniqueOrThrow({ where: { id: String(tender.id) } }))
      .status,
  ).toBe("LOST");
  await expect(
    save("competitors", { company: `Synthetic competitor ${suffix}` }, admin),
  ).rejects.toThrow();
  await expect(
    save(
      "competitor-customers",
      { competitorId: "missing-competitor", customerId },
      admin,
    ),
  ).rejects.toThrow();
  expect(
    await db.auditLog.count({
      where: {
        module: "competitors",
        recordId: String(competitor.id),
        action: "CREATE",
      },
    }),
  ).toBe(1);
});

it("keeps contribution and product metrics separate for saved records sharing the same name", async () => {
  const name = `Same-name acceptance ${suffix}`;
  const expected = [];
  for (const [index, revenue, cost] of [
    [1, "10", "4"],
    [2, "20", "18"],
  ] as const) {
    const customer = await save(
      "customers",
      { name, address: `Synthetic separate hospital ${index}` },
      admin,
    );
    const manufacturer = await save(
      "manufacturers",
      { name: `Same-name brand ${suffix}-${index}` },
      admin,
    );
    const product = await save(
      "products",
      { name, model: `Model ${index}`, manufacturerId: manufacturer.id },
      admin,
    );
    const order = await save(
      "orders",
      {
        number: `Identity-order-${suffix}-${index}`,
        customerId: customer.id,
        poDate: "2020-01-01",
        confirmed: true,
        historical: true,
        items: [
          {
            equipment: name,
            productId: product.id,
            quantity: 1,
            unitPrice: revenue,
            taxRate: "0",
          },
        ],
      },
      admin,
    );
    await save(
      "invoices",
      {
        number: `Identity-invoice-${suffix}-${index}`,
        orderId: order.id,
        customerId: customer.id,
        invoiceDate: "2020-01-02",
        amount: revenue,
        taxAmount: "0",
        paymentTermDays: 30,
        historical: true,
      },
      admin,
    );
    await save(
      "costs",
      {
        title: "Actual synthetic purchase cost",
        category: "MANUFACTURER_PURCHASE",
        customerId: customer.id,
        orderId: order.id,
        productId: product.id,
        amount: cost,
        incurredDate: "2020-01-01",
      },
      admin,
    );
    expected.push({
      customerId: customer.id,
      productId: product.id,
      revenue,
      cost,
      margin: index === 1 ? "60.0000" : "10.0000",
    });
  }
  const restrictedReport = await managementReport(
    {
      ...admin,
      role: "EMPLOYEE",
      permissions: [
        "analytics",
        "pricing",
        "products",
        "manufacturers",
        "costs",
      ].map((module) => ({
        id: module,
        userId: admin.id,
        module,
        read: true,
        write: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    },
    new URLSearchParams(),
  );
  expect(restrictedReport.profitability).toBeNull();
  expect(
    restrictedReport.productMetrics.every(
      (p) =>
        p.operationalRevenue === null &&
        p.recordedContribution === null &&
        p.operationalMargin === null,
    ),
  ).toBe(true);
  const report = await managementReport(admin, new URLSearchParams());
  expect(
    report.profitability?.groups.filter(
      (g) => g.dimension === "customer" && g.key === name,
    ),
  ).toHaveLength(2);
  expect(
    report.profitability?.groups.filter(
      (g) => g.dimension === "product" && g.key === name,
    ),
  ).toHaveLength(2);
  for (const e of expected) {
    for (const [dimension, id] of [
      ["customer", e.customerId],
      ["product", e.productId],
    ] as const)
      expect(
        report.profitability?.groups.find(
          (g) => g.dimension === dimension && g.recordId === id,
        ),
      ).toMatchObject({
        revenue: e.revenue + ".00",
        recordedCosts: e.cost + ".00",
        contributionMarginPercent: e.margin,
      });
    const product = await db.product.findUniqueOrThrow({
      where: { id: String(e.productId) },
    });
    expect(
      report.productMetrics.find(
        (p) =>
          p.model === product.model &&
          p.manufacturerId === product.manufacturerId,
      ),
    ).toMatchObject({
      operationalRevenue: e.revenue + ".00",
      operationalMargin: e.margin,
    });
  }
});
