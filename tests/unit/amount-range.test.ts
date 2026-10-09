import { expect, it } from "vitest";
import { cents, orderTotal } from "@/lib/business";
import { invoiceLedger } from "@/lib/revenue";

it("reads large calculated database totals exactly even when they exceed input field width", () => {
  expect(cents("9999999999999999.99")).toBe(999999999999999999n);
  expect(invoiceLedger("1999999999998.00", [], [])).toMatchObject({
    charged: 199999999999800n,
    outstanding: 199999999999800n,
  });
});
it("rejects oversized order calculations before a database numeric overflow", () => {
  expect(() =>
    orderTotal([
      { quantity: 1000000, unitPrice: "999999999999", taxRate: "100" },
    ]),
  ).toThrow("Order exceeds the supported amount range");
});
