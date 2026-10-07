import { api, AppError, json } from "@/lib/errors";
import { authorize, csrf, audit, can } from "@/lib/auth";
import { collection, delegate, resources } from "@/lib/resources";
import { safeRecord, assertNotificationScope } from "@/lib/record-query";
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
    if (name === "notifications") await assertNotificationScope(user, row);
    if (name === "generated" && !can(user, String(row.sourceModule)))
      throw new AppError(
        403,
        "You do not have permission for the source record",
      );
    if (
      name === "tasks" &&
      user.role !== "ADMIN" &&
      row.createdById !== user.id &&
      row.assignedToId !== user.id
    )
      throw new AppError(404, "Record not found");
    if (name === "users") {
      delete row.passwordHash;
    }
    return Response.json(safeRecord(name, row));
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
      user = await authorize(name, name !== "notifications");
    const input = await json(req);
    if (name === "notifications") {
      const row = await db.notification.findFirst({
        where: { id, userId: user.id },
      });
      if (!row) throw new AppError(404, "Notification not found");
      await assertNotificationScope(user, row);
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
    const expected = req.headers.get("if-match")?.replace(/^"|"$/g, "");
    if (
      !expected ||
      !/^\d{4}-\d{2}-\d{2}T/.test(expected) ||
      Number.isNaN(Date.parse(expected))
    )
      throw new AppError(
        428,
        "Reload the record before editing; its version is required",
      );
    return Response.json(
      await save(name, input, user, id, new Date(expected).toISOString()),
    );
  });
}
