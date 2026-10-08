import { afterEach, expect, it, vi } from "vitest";
import { verifyPassword } from "@/lib/auth";
import { prepareRevenue } from "@/lib/revenue-service";
import { recordWhere } from "@/lib/record-query";
import type { Prisma } from "@/generated/prisma/client";
import type { Actor } from "@/lib/auth";
const cookieSet = vi.hoisted(() => vi.fn());
vi.mock("next/headers.js", () => ({
  cookies: async () => ({ set: cookieSet }),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("fails closed for malformed encoded hashes without throwing", () => {
  expect(verifyPassword("synthetic", "salt:" + "z".repeat(128))).toBe(false);
  expect(verifyPassword("synthetic", "salt:" + "0".repeat(126) + "zz")).toBe(
    false,
  );
});
it("expires production Host cookies with Secure, root path, and no Domain", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.resetModules();
  const { clearSessionCookie } = await import("@/lib/auth");
  await clearSessionCookie();
  expect(cookieSet).toHaveBeenCalledWith(
    "__Host-medops-session",
    "",
    expect.objectContaining({
      secure: true,
      httpOnly: true,
      path: "/",
      maxAge: 0,
    }),
  );
  expect(cookieSet.mock.calls[0][2]).not.toHaveProperty("domain");
});
it.each(["orders", "tenders"] as const)(
  "combines manufacturer and product on one %s item",
  async (name) => {
    expect(
      await recordWhere(
        name,
        { role: "ADMIN" } as Actor,
        new URLSearchParams({
          manufacturerId: "maker-a",
          productId: "product-b",
        }),
      ),
    ).toMatchObject({
      items: { some: { manufacturerId: "maker-a", productId: "product-b" } },
    });
  },
);
it.each(["deliveryId", "installationId", "ticketId"])(
  "validates inferred order/tender for cost linked by %s",
  async (field) => {
    const order = {
      id: "order-a",
      customerId: "customer",
      tenderId: "tender-a",
    };
    const equipment = { customerId: "customer", orderId: order.id };
    const tx = {
      delivery: {
        findUnique: vi.fn().mockResolvedValue({ order, orderId: order.id }),
      },
      installation: { findUnique: vi.fn().mockResolvedValue({ equipment }) },
      serviceTicket: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ customerId: "customer", equipment }),
      },
      purchaseOrder: { findUnique: vi.fn().mockResolvedValue(order) },
      tender: {
        findUnique: vi.fn().mockResolvedValue({ customerId: "customer" }),
      },
    } as unknown as Prisma.TransactionClient;
    await expect(
      prepareRevenue(
        tx,
        "costs",
        { customerId: "customer", tenderId: "tender-b", [field]: "linked" },
        {} as Actor,
        null,
      ),
    ).rejects.toThrow("order must match customer/tender");
    const data: Record<string, unknown> = {
      customerId: "customer",
      [field]: "linked",
    };
    await prepareRevenue(tx, "costs", data, {} as Actor, null);
    expect(data).toMatchObject({
      orderId: order.id,
      tenderId: "tender-a",
      postSale: true,
    });
  },
);
