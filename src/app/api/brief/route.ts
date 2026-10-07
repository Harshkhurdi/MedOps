import { api } from "@/lib/errors";
import { authorizeResource } from "@/lib/record-access";
import { todaysBrief } from "@/lib/brief";
export async function GET(req: Request) {
  return api(async () => {
    const u = await authorizeResource("brief");
    return Response.json({
      actions: await todaysBrief(u, new URL(req.url).searchParams),
      evaluatedAt: new Date().toISOString(),
      limitPerRegister: 500,
    });
  });
}
