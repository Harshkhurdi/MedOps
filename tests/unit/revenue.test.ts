import { it, expect } from "vitest";
import {
  invoiceLedger,
  operationalContribution,
  revenueSchemas,
} from "@/lib/revenue";
import { receivables } from "@/lib/reports";
it("applies credit, debit and receipt reversal consistently to receivables", () => {
  const adjustments = [
    { type: "INVOICE_CREDIT", amount: "10.01", taxAmount: "1.80" },
    { type: "INVOICE_DEBIT", amount: "5.00", taxAmount: "0.90" },
    { type: "PAYMENT_REVERSAL", amount: "15.00" },
  ];
  const ledger = invoiceLedger("118.00", [{ amount: "50.00" }], adjustments);
  expect(ledger).toEqual({
    charged: 11209n,
    received: 3500n,
    outstanding: 7709n,
  });
  expect(
    receivables([
      {
        id: "1",
        number: "1",
        total: "118.00",
        customer: { id: "c", name: "c" },
        dueDate: new Date("2020-01-01"),
        payments: [{ amount: "50.00" }],
        adjustments,
      },
    ]).outstanding,
  ).toBe("77.09");
});
it("preserves negative contribution and leaves zero revenue margin undefined", () => {
  expect(operationalContribution(100n, 250n)).toMatchObject({
    grossContribution: "-1.50",
    contributionMarginPercent: "-150.0000",
  });
  expect(
    operationalContribution(0n, 100n).contributionMarginPercent,
  ).toBeNull();
});
it("does not invent pipeline value or probability and requires correction confirmation", () => {
  const p = revenueSchemas.pipeline.parse({
    title: "Manual",
    type: "SERVICE",
    customerId: "c",
  });
  expect(p.estimatedValue).toBeUndefined();
  expect(p.probability).toBeUndefined();
  expect(() =>
    revenueSchemas.adjustments.parse({
      invoiceId: "i",
      type: "INVOICE_CREDIT",
      amount: "1",
      adjustmentDate: "2026-01-01",
      reference: "r",
      reason: "r",
    }),
  ).toThrow();
});
