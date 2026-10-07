import { currentUser } from "@/lib/auth";
import { api, AppError } from "@/lib/errors";
export async function GET() {
  return api(async () => {
    const u = await currentUser();
    if (!u) throw new AppError(401, "Please sign in");
    return Response.json({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      permissions: u.permissions,
    });
  });
}
