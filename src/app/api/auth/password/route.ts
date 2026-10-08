import { z } from "zod";
import { api, AppError, json } from "@/lib/errors";
import {
  currentUser,
  csrf,
  hashPassword,
  verifyPassword,
  digest,
  clearSessionCookie,
} from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const user = await currentUser();
    if (!user) throw new AppError(401, "Please sign in");
    const key = digest("password:" + user.id),
      now = new Date();
    const attempt = await db.loginAttempt.upsert({
      where: { key },
      create: { key, count: 1 },
      update: { count: { increment: 1 } },
    });
    if (attempt.lockedUntil && attempt.lockedUntil > now)
      throw new AppError(
        429,
        "Too many password attempts. Try again in 15 minutes",
      );
    if (now.getTime() - attempt.windowStart.getTime() > 900000)
      await db.loginAttempt.update({
        where: { key },
        data: { count: 1, windowStart: now, lockedUntil: null },
      });
    else if (attempt.count > 10) {
      await db.loginAttempt.update({
        where: { key },
        data: { lockedUntil: new Date(now.getTime() + 900000) },
      });
      throw new AppError(
        429,
        "Too many password attempts. Try again in 15 minutes",
      );
    }
    const data = z
      .object({
        currentPassword: z.string().min(1).max(256),
        newPassword: z.string().min(12).max(256),
      })
      .strict()
      .parse(await json(req));
    if (!verifyPassword(data.currentPassword, user.passwordHash))
      throw new AppError(400, "Current password is incorrect");
    if (data.currentPassword === data.newPassword)
      throw new AppError(400, "Choose a different password");
    const hash = hashPassword(data.newPassword);
    await db.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: user.id, passwordHash: user.passwordHash, active: true },
        data: { passwordHash: hash },
      });
      if (!updated.count)
        throw new AppError(409, "Your account changed. Sign in again");
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          module: "users",
          action: "CHANGE_OWN_PASSWORD",
        },
      });
    });
    await clearSessionCookie();
    await db.loginAttempt.deleteMany({ where: { key } });
    return Response.json({
      message: "Password changed. Sign in with your new password.",
    });
  });
}
