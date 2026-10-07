import { it, expect, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  trackerTender,
  trackerImport,
} from "@/lib/integrations/tender-tracker-contract";
import {
  integrationConfig,
  verifySignature,
  sourceFingerprint,
} from "@/lib/integrations/tender-tracker";
const tender = {
  externalTenderId: "source-001",
  sourceUrl: "https://hospital.example/tender/1",
  sourceName: "Official source",
  title: "Two medical devices",
  discoveredAt: "2026-10-07T10:00:00Z",
  items: [
    { id: "1", equipment: "Ventilator", quantity: 2 },
    { id: "2", equipment: "Monitor", quantity: null },
  ],
  documents: [],
  revisions: [],
  references: [],
};
beforeEach(() => {
  process.env.TENDER_TRACKER_INTEGRATION_SECRET = "x".repeat(48);
  process.env.TENDER_TRACKER_URL = "http://localhost:3001";
  process.env.INTEGRATION_ENVIRONMENT = "development";
});
it("preserves multi-items and missing quantities without inventing business selections", () => {
  const data = trackerImport.parse({
    grant: "x".repeat(43),
    tender,
    selectedItemIds: ["1", "2"],
  });
  expect(data.tender.items.map((i) => i.quantity)).toEqual([2, null]);
  expect(data.tender).not.toHaveProperty("manufacturerId");
});
it.each([
  { ...tender, externalTenderId: "" },
  { ...tender, deadline: "2026-02-30" },
  { ...tender, items: [{ id: "a", equipment: "Device", quantity: 0 }] },
  { ...tender, sourceUrl: "javascript:alert(1)" },
  { ...tender, sourceUrl: "https://user:password@hospital.example" },
  { ...tender, title: "<script>unsafe</script>" },
  { ...tender, approved: true },
])("rejects unsafe or invalid payload %#", (input) => {
  expect(trackerTender.safeParse(input).success).toBe(false);
});
it("rejects duplicate / unknown selected source identities", () => {
  expect(
    trackerImport.safeParse({
      grant: "x".repeat(43),
      tender,
      selectedItemIds: ["missing"],
    }).success,
  ).toBe(false);
  expect(
    trackerImport.safeParse({
      grant: "x".repeat(43),
      tender,
      selectedItemIds: ["1", "1"],
    }).success,
  ).toBe(false);
});
it("authenticates exact body, path, environment and a fresh timestamp", () => {
  const body = JSON.stringify(tender),
    ts = String(Date.now()),
    path = "/api/integrations/tender-tracker/import";
  const signature = createHmac(
    "sha256",
    process.env.TENDER_TRACKER_INTEGRATION_SECRET!,
  )
    .update(`${ts}\ndevelopment\nPOST\n${path}\n${body}`)
    .digest("hex");
  const req = new Request("http://localhost:3000" + path, {
    headers: {
      "x-medops-timestamp": ts,
      "x-medops-environment": "development",
      "x-medops-signature": signature,
    },
  });
  expect(() => verifySignature(req, body)).not.toThrow();
  expect(() => verifySignature(req, body + " ")).toThrow("authorization");
  expect(() =>
    verifySignature(
      new Request("http://localhost:3000" + path, {
        headers: {
          "x-medops-timestamp": String(Date.now() - 120000),
          "x-medops-environment": "development",
          "x-medops-signature": signature,
        },
      }),
      body,
    ),
  ).toThrow("authorization");
});
it("fails closed when environment isolation or private configuration is absent", () => {
  delete process.env.TENDER_TRACKER_INTEGRATION_SECRET;
  expect(() => integrationConfig()).toThrow("not configured");
  process.env.TENDER_TRACKER_INTEGRATION_SECRET = "x".repeat(48);
  process.env.TENDER_TRACKER_URL = "https://production.example";
  expect(() => integrationConfig()).toThrow("environment");
});
it("does not make observation-only refreshes into destructive source changes", () => {
  const a = trackerTender.parse(tender),
    b = trackerTender.parse({
      ...tender,
      discoveredAt: "2026-10-08T10:00:00Z",
    });
  expect(sourceFingerprint(a)).toBe(sourceFingerprint(b));
  expect(
    sourceFingerprint(
      trackerTender.parse({ ...tender, title: "Revised title" }),
    ),
  ).not.toBe(sourceFingerprint(a));
});
