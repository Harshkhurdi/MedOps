import { it, expect, vi } from "vitest";
import {
  aiInput,
  aiDayStart,
  openRouterBody,
  openRouterCompletion,
  nvidiaFreeModel,
  providerLoggingAllowed,
} from "@/lib/ai";
import { csvCell, receivables } from "@/lib/reports";
import { json } from "@/lib/errors";
const input = {
  purpose: "REWRITE",
  text: "Synthetic text entered explicitly",
  consent: true,
} as const;
it("requires fresh explicit AI consent and rejects stored-record attachments", () => {
  expect(aiInput.safeParse({ ...input, consent: false }).success).toBe(false);
  expect(
    aiInput.safeParse({ ...input, fileId: "private-document" }).success,
  ).toBe(false);
  expect(
    aiInput.safeParse({ ...input, sourceModule: "tenders", sourceId: "secret" })
      .success,
  ).toBe(false);
});
it("routes only entered text with required privacy controls and no tools", () => {
  const body = openRouterBody(input, "synthetic/model", 100);
  expect(body.provider).toEqual({
    data_collection: "deny",
    zdr: true,
    allow_fallbacks: false,
  });
  expect(body.messages[1]).toEqual({ role: "user", content: input.text });
  expect(body).not.toHaveProperty("tools");
  expect(body).not.toHaveProperty("plugins");
});
it("limits the explicit logging exception to the selected NVIDIA free model", () => {
  vi.stubEnv("OPENROUTER_ALLOW_PROVIDER_LOGGING", "false");
  expect(providerLoggingAllowed(nvidiaFreeModel)).toBe(false);
  vi.stubEnv("OPENROUTER_ALLOW_PROVIDER_LOGGING", "true");
  expect(providerLoggingAllowed(nvidiaFreeModel)).toBe(true);
  expect(providerLoggingAllowed("different/model")).toBe(false);
  vi.unstubAllEnvs();
  expect(
    openRouterBody(input, "different/model", 100, true).provider,
  ).toMatchObject({ zdr: true, data_collection: "deny" });
  expect(openRouterBody(input, nvidiaFreeModel, 100, true).provider).toEqual({
    zdr: false,
    data_collection: "allow",
    allow_fallbacks: false,
    only: ["Nvidia"],
  });
});
it("rejects provider logging before any network call without non-confidential confirmation", async () => {
  const fetcher = vi.fn<typeof fetch>();
  await expect(
    openRouterCompletion(input, nvidiaFreeModel, 100, "test", fetcher, true),
  ).rejects.toThrow("no confidential or personal");
  expect(fetcher).not.toHaveBeenCalled();
});
it("uses the India calendar day for the daily request allowance", () => {
  expect(aiDayStart(new Date("2026-10-07T18:29:59Z")).toISOString()).toBe(
    "2026-10-06T18:30:00.000Z",
  );
  expect(aiDayStart(new Date("2026-10-07T18:30:00Z")).toISOString()).toBe(
    "2026-10-07T18:30:00.000Z",
  );
});
it("handles an actual provider response contract without revealing its API key", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: { content: "Reviewed synthetic draft" },
        },
      ],
      usage: { completion_tokens: 7, cost: 0.0002 },
    }),
  );
  const result = await openRouterCompletion(
    input,
    "synthetic/model",
    100,
    "synthetic-private-key",
    fetcher,
  );
  expect(result).toMatchObject({
    text: "Reviewed synthetic draft",
    outputTokens: 7,
    costUsd: 0.0002,
    truncated: false,
  });
  expect(JSON.stringify(result)).not.toContain("synthetic-private-key");
  expect(fetcher.mock.calls[0][0]).toBe(
    "https://openrouter.ai/api/v1/chat/completions",
  );
});
it("reports truncated provider responses rather than pretending they are complete", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      choices: [
        { finish_reason: "length", message: { content: "Partial draft" } },
      ],
    }),
  );
  expect(
    (await openRouterCompletion(input, "synthetic/model", 100, "test", fetcher))
      .truncated,
  ).toBe(true);
});
it("fails safely for provider billing, timeout and malformed responses", async () => {
  for (const status of [401, 402, 404, 429, 500]) {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("private provider details", { status }));
    await expect(
      openRouterCompletion(input, "synthetic/model", 100, "test", fetcher),
    ).rejects.not.toThrow("private provider details");
  }
  await expect(
    openRouterCompletion(
      input,
      "synthetic/model",
      100,
      "test",
      vi
        .fn<typeof fetch>()
        .mockRejectedValue(new Error("secret transport metadata")),
    ),
  ).rejects.toThrow("did not respond");
  await expect(
    openRouterCompletion(
      input,
      "synthetic/model",
      100,
      "test",
      vi.fn<typeof fetch>().mockResolvedValue(Response.json({ choices: [] })),
    ),
  ).rejects.toThrow("usable draft");
});
it("calculates exact receivables and keeps identically named customers separate", () => {
  const report = receivables(
    [
      {
        id: "a",
        number: "A",
        total: "100.10",
        dueDate: new Date("2026-10-01"),
        customer: { id: "one", name: "Same Name" },
        payments: [{ amount: "0.10" }],
      },
      {
        id: "b",
        number: "B",
        total: "20.25",
        dueDate: new Date("2026-11-01"),
        customer: { id: "two", name: "Same Name" },
        payments: [],
      },
      {
        id: "c",
        number: "C",
        total: "1.00",
        dueDate: new Date("2026-01-01"),
        customer: { id: "one", name: "Same Name" },
        payments: [{ amount: "1.00" }],
      },
    ],
    new Date("2026-10-07"),
  );
  expect(report.outstanding).toBe("120.25");
  expect(report.received).toBe("1.10");
  expect(report.overdue).toBe("100.00");
  expect(report.customers).toHaveLength(2);
  expect(report.aging[0].amount).toBe("20.25");
  expect(report.aging[1].amount).toBe("100.00");
  expect(report.invoices).toHaveLength(2);
});
it("prevents spreadsheet formula execution in CSV values", () => {
  for (const value of ["=HYPERLINK(1)", "+SUM(1)", " @command", "\t=SUM(1)"])
    expect(csvCell(value)).toMatch(/^"'/);
  expect(csvCell('normal "text"')).toBe('"normal ""text"""');
});
it("bounds JSON bodies before parsing", async () => {
  await expect(
    json(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "x".repeat(250001) }),
      }),
    ),
  ).rejects.toThrow("too large");
  expect(
    await json(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"ok":true}',
      }),
    ),
  ).toEqual({ ok: true });
});
