import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  can: vi.fn(),
  ticket: vi.fn(),
  warranties: vi.fn(),
  amcs: vi.fn(),
}));
vi.mock("@/lib/record-access", () => ({
  authorizeResource: mocks.authorize,
  canResource: mocks.can,
}));
vi.mock("@/lib/db", () => ({
  db: {
    serviceTicket: { findUnique: mocks.ticket },
    warranty: { findMany: mocks.warranties },
    amcContract: { findMany: mocks.amcs },
  },
}));
import { GET } from "@/app/api/service/tickets/[id]/coverage/route";
import { AppError } from "@/lib/errors";
const context = { params: Promise.resolve({ id: "synthetic-ticket" }) };
const request = new Request(
  "http://localhost/api/service/tickets/synthetic-ticket/coverage",
);
const period = (start: string, end: string) => ({
  startDate: new Date(start),
  endDate: new Date(end),
});
beforeEach(() => {
  vi.useFakeTimers();
  // India has entered Oct 10 although UTC is still Oct 9.
  vi.setSystemTime(new Date("2026-10-09T20:00:00Z"));
  mocks.authorize.mockResolvedValue({ id: "synthetic-user" });
  mocks.can.mockReturnValue(true);
  mocks.ticket.mockResolvedValue({ equipmentId: "synthetic-equipment" });
  mocks.warranties.mockResolvedValue([]);
  mocks.amcs.mockResolvedValue([]);
});
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

it("loads real linked periods, includes the last covered India day and omits AMC prices", async () => {
  mocks.warranties.mockResolvedValue([
    { id: "w", ...period("2026-01-01", "2026-10-10") },
  ]);
  mocks.amcs.mockResolvedValue([
    { id: "a", status: "ACTIVE", ...period("2026-10-10", "2027-10-10") },
  ]);
  const response = await GET(request, context);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(await response.json()).toMatchObject({
    warrantyStatus: "Active",
    amcStatus: "Active",
  });
  expect(mocks.amcs.mock.calls[0][0].select).not.toHaveProperty("amount");
  expect(mocks.warranties.mock.calls[0][0].where).toEqual({
    equipmentId: "synthetic-equipment",
  });
});
it("does not treat cancelled AMCs, expired warranties or future periods as current coverage", async () => {
  mocks.warranties.mockResolvedValue([period("2026-01-01", "2026-10-09")]);
  mocks.amcs.mockResolvedValue([
    { status: "CANCELLED", ...period("2026-01-01", "2027-01-01") },
  ]);
  expect(await (await GET(request, context)).json()).toMatchObject({
    warrantyStatus: "Expired or inactive",
    amcStatus: "Expired or inactive",
  });
  mocks.warranties.mockResolvedValue([period("2026-10-11", "2027-10-11")]);
  expect(await (await GET(request, context)).json()).toMatchObject({
    warrantyStatus: "Upcoming",
  });
});
it("hides coverage registers when the ticket employee lacks their permissions", async () => {
  mocks.can.mockReturnValue(false);
  const body = await (await GET(request, context)).json();
  expect(body).not.toHaveProperty("warrantyStatus");
  expect(body).not.toHaveProperty("amcs");
  expect(mocks.warranties).not.toHaveBeenCalled();
  expect(mocks.amcs).not.toHaveBeenCalled();
});
it("does not invent coverage for an unlinked manual ticket", async () => {
  mocks.ticket.mockResolvedValue({ equipmentId: null });
  expect(await (await GET(request, context)).json()).toMatchObject({
    equipmentLinked: false,
  });
  expect(mocks.warranties).not.toHaveBeenCalled();
});
it("returns safe JSON for missing tickets and denies unauthenticated access", async () => {
  mocks.ticket.mockResolvedValue(null);
  expect((await GET(request, context)).status).toBe(404);
  mocks.authorize.mockRejectedValue(new AppError(401, "Sign in required"));
  expect((await GET(request, context)).status).toBe(401);
});
