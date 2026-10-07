import { z } from "zod";
import { api, AppError, json } from "@/lib/errors";
import { authorize, csrf } from "@/lib/auth";
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    await authorize("tenders", true);
    const { url } = z
      .object({ url: z.url() })
      .strict()
      .parse(await json(req));
    const u = new URL(url);
    if (
      u.protocol !== "https:" ||
      !["gem.gov.in", "bidplus.gem.gov.in", "mkp.gem.gov.in"].includes(
        u.hostname,
      ) ||
      u.port ||
      u.username ||
      u.password
    )
      throw new AppError(400, "Use an official HTTPS GeM tender URL");
    try {
      const response = await fetch(u, {
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "MedOps deterministic metadata reader" },
        cache: "no-store",
      });
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("text/html")
      )
        return Response.json({
          url,
          message:
            "Portal access is restricted. Enter the tender details manually.",
        });
      const reader = response.body?.getReader();
      let html = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          html += new TextDecoder().decode(value);
          if (html.length > 500000) {
            await reader.cancel();
            break;
          }
        }
      }
      const title = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)?.[1];
      return Response.json({
        url,
        title: title?.trim(),
        message:
          "Only publicly accessible page metadata was read. Confirm the tender number, deadlines and conditions manually.",
      });
    } catch {
      return Response.json({
        url,
        message:
          "Public metadata could not be retrieved. Manual entry is available.",
      });
    }
  });
}
