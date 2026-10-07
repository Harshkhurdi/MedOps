import { api, AppError, json } from "@/lib/errors";
import { authorize, csrf, audit } from "@/lib/auth";
import { collection, delegate, resources } from "@/lib/resources";
import { save } from "@/lib/service";
import { db } from "@/lib/db";
import { schemas } from "@/lib/schemas";
export async function GET(
  req: Request,
  ctx: { params: Promise<{ module: string; id: string }> },
) {
  return api(async () => {
    const { module, id } = await ctx.params;
    const name = collection(module),
      user = await authorize(name);
    const row = await delegate(name).findUnique({
      where: { id },
      include: resources[name].include,
    });
    if (!row || (name === "notifications" && row.userId !== user.id))
      throw new AppError(404, "Record not found");
    if (name === "users") {
      delete row.passwordHash;
    }
    return Response.json(row);
  });
}
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ module: string; id: string }> },
) {
  return api(async () => {
    csrf(req);
    const { module, id } = await ctx.params;
    const name = collection(module),
      user = await authorize(name, true);
    const input = await json(req);
    if (name === "notifications") {
      const row = await db.notification.findFirst({
        where: { id, userId: user.id },
      });
      if (!row) throw new AppError(404, "Notification not found");
      const data = schemas.notifications.parse(input);
      const record = await db.notification.update({
        where: { id },
        data: {
          ...(data.read !== undefined
            ? { readAt: data.read ? new Date() : null }
            : {}),
          ...(data.dismiss ? { dismissedAt: new Date() } : {}),
        },
      });
      await audit(user.id, "UPDATE", "notifications", id);
      return Response.json(record);
    }
    return Response.json(await save(name, input, user, id));
  });
}
