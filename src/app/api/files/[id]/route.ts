import { authorizeResource } from "@/lib/record-access";
import { api, AppError } from "@/lib/errors";
import { audit, currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { retrieve } from "@/lib/storage";
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    if (!(await currentUser())) throw new AppError(401, "Please sign in");
    const file = await db.storedFile.findUnique({
      where: { id: (await ctx.params).id },
    });
    if (!file) throw new AppError(404, "File not found");
    const user = await authorizeResource(file.module);
    const bytes = await retrieve(file.key);
    await audit(user.id, "DOWNLOAD_FILE", file.module, file.recordId, {
      fileId: file.id,
    });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `${new URL(req.url).searchParams.get("preview") === "1" && ["application/pdf", "image/png", "image/jpeg"].includes(file.mime) ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
