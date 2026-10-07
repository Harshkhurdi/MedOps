import { ZodError } from "zod";
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api(fn: () => Promise<Response>) {
  try {
    const response = await fn();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    let status = 500,
      message = "The operation could not be completed. Please try again.";
    if (error instanceof AppError) {
      status = error.status;
      message = error.message;
    } else if (error instanceof ZodError) {
      status = 400;
      message = error.issues
        .map((x) => `${x.path.join(".")}: ${x.message}`)
        .join("; ");
    } else if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        status = 409;
        message = "This record already exists.";
      }
      if (error.code === "P2003") {
        status = 400;
        message = "A linked record does not exist or is still in use.";
      }
      if (error.code === "P2025") {
        status = 404;
        message = "Record not found.";
      }
      if (error.code === "P2034") {
        status = 409;
        message = "Another update happened at the same time. Please retry.";
      }
    }
    if (status === 500)
      console.error(
        "MedOps operation failed",
        error instanceof Error ? error.name : "Unknown error",
      );
    return Response.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export async function json(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new AppError(415, "Use application/json");
  const reader = req.body?.getReader();
  if (!reader) throw new AppError(400, "Request body is missing");
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 250000) {
      await reader.cancel();
      throw new AppError(413, "Request is too large");
    }
    parts.push(value);
  }
  const text = Buffer.concat(parts).toString("utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError(400, "Invalid JSON");
  }
}
