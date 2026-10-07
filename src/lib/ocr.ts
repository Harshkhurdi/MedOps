import { AppError } from "./errors";
import { z } from "zod";
export function ocrConfiguration() {
  const url = process.env.OCR_WORKER_URL,
    token = process.env.OCR_WORKER_TOKEN;
  let available = false;
  if (url && token && process.env.OCR_WORKER_APPROVED === "true") {
    try {
      const u = new URL(url);
      available =
        !u.username &&
        !u.password &&
        !u.search &&
        !u.hash &&
        (u.protocol === "https:" ||
          (!process.env.VERCEL &&
            u.protocol === "http:" &&
            ["localhost", "127.0.0.1"].includes(u.hostname)));
    } catch {}
  }
  return {
    available,
    mode: available ? "PRIVATE_WORKER" : "DISABLED",
    message: available
      ? "Only explicitly selected files are processed by your configured private OCR worker. Text remains unverified."
      : "Scanned-document OCR is unavailable until a private worker is configured. Selectable PDF extraction and manual entry remain available.",
  };
}
export async function privateOcr(
  bytes: Buffer,
  mime: string,
  fetcher: typeof fetch = fetch,
) {
  if (!ocrConfiguration().available)
    throw new AppError(503, ocrConfiguration().message);
  if (!["application/pdf", "image/png", "image/jpeg"].includes(mime))
    throw new AppError(400, "Select a PDF, PNG or JPEG");
  const response = await fetcher(process.env.OCR_WORKER_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OCR_WORKER_TOKEN}`,
      "Content-Type": mime,
    },
    body: new Uint8Array(bytes),
    redirect: "error",
    signal: AbortSignal.timeout(45000),
  }).catch(() => {
    throw new AppError(
      503,
      "Private OCR worker unavailable; use manual entry or selectable PDF extraction",
    );
  });
  if (!response.ok)
    throw new AppError(
      503,
      "Private OCR worker rejected the file; manual entry remains available",
    );
  const reader = response.body?.getReader();
  if (!reader) throw new AppError(503, "OCR response is missing");
  let size = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 350000) {
      await reader.cancel();
      throw new AppError(413, "OCR output exceeds the allowed length");
    }
    parts.push(value);
  }
  const output = z
    .object({ text: z.string().max(300000) })
    .parse(JSON.parse(Buffer.concat(parts).toString("utf8")));
  return {
    text: output.text,
    label: "Unverified extracted text",
    message:
      "Confirm every important value before entering or updating records. OCR never updates records automatically.",
  };
}
