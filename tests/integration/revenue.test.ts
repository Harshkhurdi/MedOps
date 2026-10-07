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
