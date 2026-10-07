import { api, json, AppError } from "@/lib/errors";
import { authorize, csrf, can } from "@/lib/auth";
import { collection, delegate, resources } from "@/lib/resources";
import { save } from "@/lib/service";
export const runtime = "nodejs";
export async function GET(
  req: Request,
  ctx: { params: Promise<{ module: string }> },
) {
  return api(async () => {
    const name = collection((await ctx.params).module),
      user = await authorize(name);
    const params = new URL(req.url).searchParams;
    const page = Math.max(1, Math.min(10000, Number(params.get("page")) || 1)),
      limit = Math.max(1, Math.min(100, Number(params.get("limit")) || 20));
    const q = (params.get("q") ?? "").slice(0, 200);
    const where: Record<string, unknown> = {};
    if (q)
      where.OR = resources[name].search.map((field) => ({
        [field]: { contains: q, mode: "insensitive" },
      }));
    if (name === "notifications") {
      where.userId = user.id;
      where.dismissedAt = null;
    }
    if (name === "generated" && user.role !== "ADMIN") {
      where.sourceModule = {
        in: user.permissions
          .filter((permission) => permission.read)
          .map((permission) => permission.module),
      };
    }
    const status = params.get("status");
    if (
      status &&
      ["tenders", "orders", "installations", "amcs", "visits"].includes(name)
    )
      where.status = status;
    const parent = params.get("parent");
    const parentFields: Record<string, string> = {
      requirements: "tenderId",
      generated: "tenderId",
      deliveries: "orderId",
      installations: "equipmentId",
      warranties: "equipmentId",
      visits: "amcId",
      payments: "invoiceId",
      followups: "invoiceId",
    };
    if (parent && parentFields[name]) where[parentFields[name]] = parent;
    const sort = params.get("sort") === "oldest" ? "asc" : "desc";
    const d = delegate(name);
    const [rows, total] = await Promise.all([
      d.findMany({
        where,
        include: resources[name].include,
        orderBy: { createdAt: sort },
        skip: (page - 1) * limit,
        take: limit,
      }),
      d.count({ where }),
    ]);
    const safeRows = rows.map((row) => {
      if (name === "users") {
        const { passwordHash: _, ...safe } = row;
        void _;
        return safe;
      }
      return row;
    });
    if (name === "audit" && !can(user, "audit"))
      throw new AppError(403, "Permission denied");
    return Response.json({ rows: safeRows, total, page, limit });
  });
}
export async function POST(
  req: Request,
  ctx: { params: Promise<{ module: string }> },
) {
  return api(async () => {
    csrf(req);
    const name = collection((await ctx.params).module);
    const user = await authorize(name, true);
    return Response.json(await save(name, await json(req), user), {
      status: 201,
    });
  });
}
