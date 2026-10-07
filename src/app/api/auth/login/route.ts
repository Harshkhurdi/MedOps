import { z } from "zod";
import { db } from "@/lib/db";
import { api, AppError, json } from "@/lib/errors";
import { csrf, verifyPassword, createSession, digest, audit } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const data = z
      .object({
        email: z
          .email()
          .max(200)
          .transform((v) => v.toLowerCase()),
        password: z.string().min(1).max(256),
      })
      .strict()
      .parse(await json(req));
    const key = digest(data.email);
    const now = new Date();
    const attempt = await db.loginAttempt.upsert({
      where: { key },
      create: { key, count: 1 },
      update: { count: { increment: 1 } },
    });
    if (attempt.lockedUntil && attempt.lockedUntil > now)
      throw new AppError(429, "Too many attempts. Try again in 15 minutes.");
    if (now.getTime() - attempt.windowStart.getTime() > 900000) {
      await db.loginAttempt.update({
        where: { key },
        data: { count: 1, windowStart: now, lockedUntil: null },
      });
    } else if (attempt.count > 10) {
      await db.loginAttempt.update({
        where: { key },
        data: { lockedUntil: new Date(now.getTime() + 900000) },
      });
      throw new AppError(429, "Too many attempts. Try again in 15 minutes.");
    }
    const user = await db.user.findUnique({ where: { email: data.email } });
    const fallback = "0123456789abcdef0123456789abcdef:" + "0".repeat(128);
    const valid = verifyPassword(data.password, user?.passwordHash ?? fallback);
    if (!user || !valid || !user.active)
      throw new AppError(401, "Email or password is incorrect");
    await db.loginAttempt.delete({ where: { key } });
    await createSession(user.id);
    await audit(user.id, "LOGIN", "users");
    return Response.json({ name: user.name, role: user.role });
  });
}
