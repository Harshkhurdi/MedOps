import { api, AppError } from "@/lib/errors";
import { currentUser, can } from "@/lib/auth";
import { db } from "@/lib/db";
export async function GET() {
  return api(async () => {
    const user = await currentUser();
    if (!user) throw new AppError(401, "Please sign in");
    if (
      !["visits", "followups", "tasks", "users", "rfqs", "rfq-followups"].some(
        (m) => can(user, m),
      )
    )
      throw new AppError(403, "Employee directory permission required");
    return Response.json({
      rows: await db.user.findMany({
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
        take: 100,
      }),
    });
  });
}
