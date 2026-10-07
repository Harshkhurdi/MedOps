import { api, AppError } from "@/lib/errors";
import { authorize, csrf } from "@/lib/auth";
import { limitedFormData } from "@/lib/storage";
import { readImportFile } from "@/lib/import-file";
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const u = await authorize("imports", true);
    if (u.role !== "ADMIN")
      throw new AppError(403, "Administrator access required");
    const f = await limitedFormData(req),
      file = f.get("file");
    if (!(file instanceof File))
      throw new AppError(400, "Choose a CSV or XLSX");
    return Response.json(
      await readImportFile(file.name, Buffer.from(await file.arrayBuffer())),
    );
  });
}
