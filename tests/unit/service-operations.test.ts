import { it, expect } from "vitest";
import { inventoryBalance } from "@/lib/service-operations";
import { amcReason } from "@/lib/opportunities";
import { slaMetrics } from "@/lib/service-metrics";
it("preserves available stock while reserving, releasing and consuming held parts", () => {
  expect(inventoryBalance(5, 0, "RESERVE", 3)).toEqual({
    onHand: 5,
    reserved: 3,
  });
  expect(() => inventoryBalance(5, 3, "OUT", 3)).toThrow("Insufficient");
  expect(inventoryBalance(5, 3, "USED_IN_SERVICE", 2, true)).toEqual({
    onHand: 3,
    reserved: 1,
  });
  expect(() => inventoryBalance(5, 1, "RELEASE", 2)).toThrow();
  expect(() => inventoryBalance(5, 0, "IN", -1)).toThrow("positive");
});
it("identifies real AMC windows and excludes equipment with adequate active AMC or warranty", () => {
  const now = new Date("2026-10-01");
  expect(amcReason(new Date("2026-10-30"), null, false, now)?.reason).toBe(
    "WARRANTY_ENDING",
  );
  expect(amcReason(new Date("2026-09-30"), null, false, now)?.reason).toBe(
    "WARRANTY_EXPIRED",
  );
  expect(amcReason(null, new Date("2027-10-01"), true, now)).toBeNull();
  expect(amcReason(null, new Date("2026-12-01"), true, now)?.reason).toBe(
    "AMC_RENEWAL",
  );
  expect(amcReason(null, null, false, now)?.reason).toBe("NO_SERVICE_CONTRACT");
  expect(amcReason(new Date("2027-10-01"), null, false, now)).toBeNull();
});
it("uses actual elapsed dates for SLA metrics and shows breaches without invented averages", () => {
  const now = new Date("2026-10-01T10:00:00Z");
  const base = {
    status: "OPEN",
    priority: "CRITICAL",
    reportedAt: new Date("2026-10-01T08:00:00Z"),
    assignedAt: null,
    firstVisitAt: null,
    resolvedAt: null,
    assignmentDueAt: new Date("2026-10-01T09:00:00Z"),
    firstVisitDueAt: null,
    resolutionDueAt: null,
  };
  expect(slaMetrics([base], now)).toMatchObject({
    open: 1,
    critical: 1,
    slaBreaches: 1,
    averageResolutionMinutes: null,
  });
  expect(
    slaMetrics(
      [
        {
          ...base,
          status: "RESOLVED",
          assignedAt: new Date("2026-10-01T08:30:00Z"),
          resolvedAt: now,
        },
      ],
      now,
    ),
  ).toMatchObject({
    slaBreaches: 0,
    averageAssignmentMinutes: 30,
    averageResolutionMinutes: 120,
  });
});
