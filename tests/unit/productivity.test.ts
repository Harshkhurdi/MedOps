import { it, expect, vi, afterEach } from "vitest";
import ExcelJS from "exceljs";
import { parseCsv, readImportFile } from "@/lib/import-file";
import { ocrConfiguration, privateOcr } from "@/lib/ocr";
import { reportDates } from "@/lib/management-dates";
afterEach(() => vi.unstubAllEnvs());
it("reads quoted CSV without executing formula text and rejects malformed/oversized rows", async () => {
  expect(parseCsv('name,notes\r\n"Hospital, One","a ""quoted"" note"')).toEqual(
    [
      ["name", "notes"],
      ["Hospital, One", 'a "quoted" note'],
    ],
  );
  expect(() => parseCsv('name\n"unfinished')).toThrow();
  expect(
    (await readImportFile("safe.csv", Buffer.from('name\n=HYPERLINK("x")')))
      .rows[0][0],
  ).toContain("=HYPERLINK");
  await expect(
    readImportFile("bad.csv", Buffer.from("name,name\na,b")),
  ).rejects.toThrow(/unique/);
});
it("rejects Excel formulas and accepts plain dated values", async () => {
  const b = new ExcelJS.Workbook(),
    s = b.addWorksheet("Data");
  s.addRow(["name"]);
  s.addRow([{ formula: 'HYPERLINK("https://evil.test")', result: "Text" }]);
  await expect(
    readImportFile("formula.xlsx", Buffer.from(await b.xlsx.writeBuffer())),
  ).rejects.toThrow(/Formulas/);
  s.getCell("A2").value = "Synthetic";
  expect(
    (
      await readImportFile(
        "plain.xlsx",
        Buffer.from(await b.xlsx.writeBuffer()),
      )
    ).rows,
  ).toEqual([["Synthetic"]]);
});
it("keeps OCR disabled without approved private configuration and rejects insecure hosted URLs", async () => {
  vi.stubEnv("OCR_WORKER_URL", "https://private.example.test/ocr");
  vi.stubEnv("OCR_WORKER_TOKEN", "synthetic-test-token");
  vi.stubEnv("OCR_WORKER_APPROVED", "false");
  const fetcher = vi.fn();
  await expect(
    privateOcr(Buffer.from("x"), "image/png", fetcher),
  ).rejects.toThrow(/unavailable/);
  expect(fetcher).not.toHaveBeenCalled();
  vi.stubEnv("OCR_WORKER_APPROVED", "true");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("OCR_WORKER_URL", "http://127.0.0.1:8787");
  expect(ocrConfiguration().available).toBe(false);
});
it("returns labelled unverified OCR text only from the explicitly configured worker", async () => {
  vi.stubEnv("OCR_WORKER_URL", "https://private.example.test/ocr");
  vi.stubEnv("OCR_WORKER_TOKEN", "synthetic-test-token");
  vi.stubEnv("OCR_WORKER_APPROVED", "true");
  const fetcher = vi
    .fn()
    .mockResolvedValue(Response.json({ text: "Synthetic OCR result" }));
  expect((await privateOcr(Buffer.from("x"), "image/png", fetcher)).label).toBe(
    "Unverified extracted text",
  );
  expect(fetcher.mock.calls[0][0]).toBe("https://private.example.test/ocr");
  expect(fetcher.mock.calls[0][1].redirect).toBe("error");
});
it("validates report date ranges", () => {
  expect(() =>
    reportDates(new URLSearchParams({ from: "2026-02-30" })),
  ).toThrow();
  expect(() =>
    reportDates(new URLSearchParams({ from: "2026-01-03", to: "2026-01-01" })),
  ).toThrow();
  expect(() => reportDates(new URLSearchParams({ from: "bad" }))).toThrow();
  expect(
    reportDates(
      new URLSearchParams({ from: "2026-01-01", to: "2026-01-31" }),
    ).end?.toISOString(),
  ).toBe("2026-01-31T23:59:59.999Z");
});
