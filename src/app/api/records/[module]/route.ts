import { authorizeResource } from "@/lib/record-access";
import { api, json } from "@/lib/errors";
import { csrf } from "@/lib/auth";
import { collection, delegate, resources } from "@/lib/resources";
import { recordWhere, safeRecord } from "@/lib/record-query";
import { save } from "@/lib/service";
export const runtime = "nodejs";
export async function GET(
  req: Request,
  ctx: { params: Promise<{ module: string }> },
) {
  return api(async () => {
    const name = collection((await ctx.params).module),
      user = await authorizeResource(name);
    const params = new URL(req.url).searchParams;
    const page = Math.max(
        1,
        Math.min(10000, Math.floor(Number(params.get("page")) || 1)),
      ),
      limit = Math.max(
        1,
        Math.min(100, Math.floor(Number(params.get("limit")) || 20)),
      );
    const where = await recordWhere(name, user, params),
      d = delegate(name);
    const [rows, total] = await Promise.all([
      d.findMany({
        where,
        include: resources[name].include,
        orderBy: {
          createdAt: params.get("sort") === "oldest" ? "asc" : "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      d.count({ where }),
    ]);
    return Response.json({
      rows: rows.map((row) => safeRecord(name, row)),
      total,
      page,
      limit,
    });
  });
}
export async function POST(
  req: Request,
  ctx: { params: Promise<{ module: string }> },
) {
  return api(async () => {
    csrf(req);
    const name = collection((await ctx.params).module);
    const user = await authorizeResource(name, true);
    return Response.json(await save(name, await json(req), user), {
      status: 201,
    });
  });
}
