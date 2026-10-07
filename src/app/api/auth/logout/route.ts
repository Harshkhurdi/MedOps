import { cookies } from "next/headers.js";
import { db } from "@/lib/db";
import { api } from "@/lib/errors";
import { csrf, COOKIE, digest } from "@/lib/auth";
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (token)
      await db.session.deleteMany({ where: { tokenHash: digest(token) } });
    jar.delete(COOKIE);
    return Response.json({ ok: true });
  });
}
