import { api, json } from "@/lib/errors";
import { authorize, csrf } from "@/lib/auth";
import { previewImport } from "@/lib/imports";
export const maxDuration = 60;
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    return Response.json(
      await previewImport(await authorize("imports", true), await json(req)),
    );
  });
}
