import { it, expect, vi, afterEach } from "vitest";
import { checklistProgress } from "@/lib/controls";
import { emailConfigured, emailProvider } from "@/lib/email";
afterEach(() => vi.unstubAllEnvs());
it("calculates checklist progress without treating blocked or in-progress items as complete", () => {
  expect(
    checklistProgress([
      { status: "COMPLETE" },
      { status: "BLOCKED" },
      { status: "NOT_APPLICABLE" },
    ]),
  ).toEqual({ complete: 1, total: 2, percent: 50 });
  expect(checklistProgress([]).percent).toBe(0);
});
it("requires configured email and fails clearly without making a provider call", () => {
  vi.stubEnv("EMAIL_API_KEY", "");
  expect(emailConfigured()).toBe(false);
  expect(() => emailProvider()).toThrow("not configured");
});
it("sends explicit text through the configured provider with idempotency and no attachments", async () => {
  vi.stubEnv("EMAIL_PROVIDER", "resend");
  vi.stubEnv("EMAIL_API_KEY", "synthetic-key");
  vi.stubEnv("EMAIL_FROM", "synthetic@example.test");
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json({ id: "synthetic-mail" }));
  try {
    expect(
      await emailProvider().send({
        to: "recipient@example.test",
        subject: "Synthetic",
        text: "Explicit text",
        idempotencyKey: "test-id",
      }),
    ).toEqual({ id: "synthetic-mail" });
    const options = fetcher.mock.calls[0][1]!;
    expect(JSON.parse(String(options.body))).toEqual({
      from: "synthetic@example.test",
      to: ["recipient@example.test"],
      subject: "Synthetic",
      text: "Explicit text",
    });
    expect(options.headers).toHaveProperty("Idempotency-Key", "test-id");
  } finally {
    fetcher.mockRestore();
  }
});
