import { describe, it, expect } from "vitest";
import {
  cents,
  money,
  orderTotal,
  outstanding,
  addMonths,
  daysOverdue,
  renderTemplate,
  validateDelivery,
} from "@/lib/business";
import {
  hashPassword,
  verifyPassword,
  can,
  csrf,
  type Actor,
} from "@/lib/auth";
import { validateUpload, MAX_UPLOAD, store } from "@/lib/storage";
import { dateReminder } from "@/lib/reminders";
import { schemas } from "@/lib/schemas";
describe("exact financial calculations", () => {
  it("uses cents without floating point drift", () => {
    expect(cents("0.10") + cents("0.20")).toBe(30n);
    expect(money(30n)).toBe("0.30");
    expect(() => cents("-1")).toThrow();
    expect(() => cents("1.001")).toThrow();
  });
  it("calculates tax per line and supports partial receipts", () => {
    expect(
      orderTotal([{ quantity: 3, unitPrice: "100.10", taxRate: "18" }]),
    ).toBe("354.35");
    expect(
      outstanding("118.00", [{ amount: "50.25" }, { amount: "20.00" }]),
    ).toBe("47.75");
  });
  it("identifies overdue dates at calendar-day boundaries", () => {
    expect(daysOverdue(new Date("2026-01-01"), new Date("2026-01-11"))).toBe(
      10,
    );
    expect(daysOverdue(new Date("2026-01-11"), new Date("2026-01-11"))).toBe(0);
  });
});
describe("contract and dispatch rules", () => {
  it("clamps month-end and leap-year anniversaries", () => {
    expect(
      addMonths(new Date("2024-02-29"), 12).toISOString().slice(0, 10),
    ).toBe("2025-02-28");
    expect(
      addMonths(new Date("2026-01-31"), 1).toISOString().slice(0, 10),
    ).toBe("2026-02-28");
  });
  it("blocks excess partial dispatch", () => {
    expect(() => validateDelivery(5, 3, 2)).not.toThrow();
    expect(() => validateDelivery(5, 3, 3)).toThrow();
  });
  it("never assumes technical compliance", () => {
    expect(
      schemas.requirements.parse({ tenderId: "a", requirement: "Flow" })
        .compliance,
    ).toBe("REQUIRES_REVIEW");
  });
  it("creates reminders only in the configured window", () => {
    const now = new Date("2026-01-01");
    expect(
      dateReminder("amcs", "a", "Renewal", new Date("2026-02-10"), now, 30),
    ).toBeNull();
    expect(
      dateReminder("amcs", "a", "Renewal", new Date("2026-01-05"), now, 30)
        ?.priority,
    ).toBe("HIGH");
  });
});
describe("security", () => {
  it("hashes passwords and checks them in constant time", () => {
    const hash = hashPassword("synthetic-test-password");
    expect(hash).not.toContain("synthetic-test-password");
    expect(verifyPassword("synthetic-test-password", hash)).toBe(true);
    expect(verifyPassword("incorrect", hash)).toBe(false);
  });
  it("grants only assigned actions", () => {
    const employee = {
      role: "EMPLOYEE",
      permissions: [{ module: "tenders", read: true, write: false }],
    } as Actor;
    expect(can(employee, "tenders")).toBe(true);
    expect(can(employee, "tenders", true)).toBe(false);
    expect(can(employee, "payments")).toBe(false);
  });
  it("rejects cross-origin state changes", () => {
    expect(() =>
      csrf(
        new Request("http://localhost:3000/api/records/tenders", {
          headers: { origin: "https://evil.test" },
        }),
      ),
    ).toThrow();
    expect(() =>
      csrf(
        new Request("http://localhost:3000/api", {
          headers: { origin: "http://localhost:3000" },
        }),
      ),
    ).not.toThrow();
  });
  it("validates file signature, type and size", () => {
    expect(() =>
      validateUpload("f.pdf", "application/pdf", Buffer.from("%PDF-1.7\n")),
    ).not.toThrow();
    expect(() =>
      validateUpload("f.pdf", "application/pdf", Buffer.from("<script>")),
    ).toThrow();
    expect(() =>
      validateUpload("f.html", "text/html", Buffer.from("x")),
    ).toThrow();
    expect(() =>
      validateUpload("f.pdf", "application/pdf", Buffer.alloc(MAX_UPLOAD + 1)),
    ).toThrow();
  });
  it("rejects unknown request fields", () => {
    expect(() =>
      schemas.payments.parse({
        invoiceId: "a",
        amount: "1",
        paymentDate: "2026-01-01",
        reference: "a",
        method: "CASH",
        role: "ADMIN",
      }),
    ).toThrow();
  });
});
describe("templates", () => {
  it("requires every referenced placeholder", () => {
    expect(
      renderTemplate("Hello {{company_name}}", {
        company_name: "Synthetic Co",
      }),
    ).toBe("Hello Synthetic Co");
    expect(() => renderTemplate("{{missing}}", {})).toThrow("missing");
  });
});

it("fails closed if local filesystem storage is selected in production", async () => {
  const previous = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  try {
    await expect(
      store(Buffer.from("probe"), "text/plain", ".txt"),
    ).rejects.toThrow("private object storage");
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: previous });
  }
});
