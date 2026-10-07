import { it, expect } from "vitest";
import {
  commercialCalculation,
  rfqTransition,
  signedMoney,
} from "@/lib/commercial";
it("calculates contribution exactly and preserves negative amounts", () => {
  expect(commercialCalculation("0.10", "0.20", "1.00")).toEqual({
    totalCost: "0.30",
    contribution: "0.70",
    marginPercent: "70.0000",
  });
  expect(signedMoney(-5n)).toBe("-0.05");
  expect(commercialCalculation("10", "1", "0").marginPercent).toBeNull();
});
it("enforces RFQ transition rules including terminal states", () => {
  expect(() => rfqTransition("DRAFT", "READY_TO_SEND")).not.toThrow();
  expect(() => rfqTransition("CANCELLED", "SENT")).toThrow();
  expect(() => rfqTransition("SENT", "DRAFT")).toThrow();
});
