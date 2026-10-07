import { cookies } from "next/headers";
import { z } from "zod";
import { authorize, COOKIE, csrf, digest } from "@/lib/auth";
import { db } from "@/lib/db";
import { api, AppError, json } from "@/lib/errors";
import {
  integrationConfig,
  issueCode,
  rateLimit,
} from "@/lib/integrations/tender-tracker";
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const user = await authorize("tenders", true);
    const data = z
      .object({ state: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
      .strict()
      .parse(await json(req));
    await rateLimit("connect:" + user.id, 10);
    const token = (await cookies()).get(COOKIE)?.value;
    const session = token
      ? await db.session.findUnique({ where: { tokenHash: digest(token) } })
      : null;
    if (!session) throw new AppError(401, "Please sign in");
    const code = await issueCode(session.id);
    const callback = new URL(
      "/api/medops/connect",
      integrationConfig().tracker,
    );
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", data.state);
    return Response.json({ callback: callback.toString() });
  });
}
