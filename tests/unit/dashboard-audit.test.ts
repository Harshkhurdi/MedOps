import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ invoices: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    invoice: { findMany: mocks.invoices },
    notification: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));
vi.mock("@/lib/auth", () => ({
  authorize: vi.fn().mockResolvedValue({ id: "employee", role: "EMPLOYEE" }),
  can: (_: unknown, module: string) => module === "invoices",
}));
vi.mock("@/lib/record-query", () => ({
  recordWhere: vi.fn().mockResolvedValue({}),
}));
import { GET } from "@/app/api/dashboard/route";

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

it("keeps same-name customers separate and uses India's current calendar month", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-30T20:00:00Z"));
  mocks.invoices.mockResolvedValue([
    {
      number: "OCT-1",
      customerId: "customer-a",
      customer: { name: "Hospital" },
      total: "100.00",
      dueDate: new Date("2026-10-01T00:00:00Z"),
      payments: [],
      adjustments: [],
    },
    {
      number: "SEPT-2",
      customerId: "customer-b",
      customer: { name: "Hospital" },
      total: "200.00",
      dueDate: new Date("2026-09-30T00:00:00Z"),
      payments: [],
      adjustments: [],
    },
    {
      number: "OCT-3",
      customerId: "customer-a",
      customer: { name: "Hospital" },
      total: "25.00",
      dueDate: new Date("2026-10-03T00:00:00Z"),
      payments: [],
      adjustments: [],
    },
  ]);
  const response = await GET();
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.finances.byCustomer).toEqual([
    { id: "customer-a", name: "Hospital", amount: "125.00" },
    { id: "customer-b", name: "Hospital", amount: "200.00" },
  ]);
  expect(
    data.finances.expectedThisMonth.map(
      (invoice: { number: string }) => invoice.number,
    ),
  ).toEqual(["OCT-1", "OCT-3"]);
});
