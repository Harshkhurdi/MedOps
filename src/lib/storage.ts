import { randomUUID, createHash } from "node:crypto";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { put, get, del } from "@vercel/blob";
import JSZip from "jszip";
import { AppError } from "./errors";
export const MAX_UPLOAD = 4 * 1024 * 1024;
export function validateUpload(name: string, mime: string, bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_UPLOAD)
    throw new AppError(413, "Upload a file between 1 byte and 4 MB");
  const ext = path.extname(name).toLowerCase();
  const allowed: Record<string, string> = {
    ".pdf": "application/pdf",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  };
  if (allowed[ext] !== mime)
    throw new AppError(
      400,
      "Only PDF, DOCX, XLSX, PNG and JPEG files are allowed",
    );
  const good =
    ext === ".pdf"
      ? bytes.subarray(0, 5).toString() === "%PDF-"
      : ext === ".docx" || ext === ".xlsx"
        ? bytes[0] === 0x50 && bytes[1] === 0x4b
        : ext === ".png"
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!good)
    throw new AppError(
      400,
      "File contents do not match the selected file type",
    );
}
export async function validateOfficeArchive(name: string, bytes: Buffer) {
  const extension = path.extname(name).toLowerCase();
  if (![".docx", ".xlsx"].includes(extension)) return;
  try {
    const zip = await JSZip.loadAsync(bytes);
    const entries = Object.values(zip.files);
    if (
      entries.length > 3000 ||
      !zip.file("[Content_Types].xml") ||
      !zip.file(extension === ".docx" ? "word/document.xml" : "xl/workbook.xml")
    )
      throw new AppError(400, "Upload a valid Office document");
    const total = entries.reduce(
      (sum, entry) =>
        sum +
        ((entry as unknown as { _data?: { uncompressedSize?: number } })._data
          ?.uncompressedSize ?? 0),
      0,
    );
    if (total > 32 * 1024 * 1024)
      throw new AppError(413, "Office archive expands beyond the allowed size");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, "Office document archive is invalid");
  }
}
export async function limitedFormData(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) throw new AppError(400, "Upload body is missing");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_UPLOAD + 65536) {
      await reader.cancel();
      throw new AppError(413, "File limit is 4 MB");
    }
    chunks.push(value);
  }
  return new Request(req.url, {
    method: "POST",
    headers: req.headers,
    body: new Uint8Array(Buffer.concat(chunks)),
  }).formData();
}
function driver() {
  const d = process.env.STORAGE_DRIVER ?? "local";
  if (process.env.VERCEL && d !== "blob")
    throw new AppError(503, "Production requires private object storage");
  if (d !== "local" && d !== "blob")
    throw new AppError(503, "Unknown storage driver");
  return d;
}
function localPath(key: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(key))
    throw new AppError(400, "Invalid file key");
  return path.join(process.env.LOCAL_STORAGE_PATH ?? ".local-storage", key);
}
export async function store(bytes: Buffer, mime: string, extension: string) {
  const key = randomUUID() + extension;
  if (driver() === "blob") {
    const blob = await put(`medops/${key}`, bytes, {
      access: "private",
      contentType: mime,
      addRandomSuffix: false,
    });
    return {
      key: blob.pathname,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }
  await mkdir(path.dirname(localPath(key)), { recursive: true });
  await writeFile(localPath(key), bytes, { flag: "wx", mode: 0o600 });
  return { key, sha256: createHash("sha256").update(bytes).digest("hex") };
}
export async function retrieve(key: string) {
  if (driver() === "local") return readFile(localPath(key));
  const result = await get(key, { access: "private" });
  if (!result || !result.stream) throw new AppError(404, "File not found");
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}
export async function removeStored(key: string) {
  if (driver() === "blob") await del(key);
  else await unlink(localPath(key));
}
