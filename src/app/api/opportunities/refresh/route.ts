import { api } from "@/lib/errors";
import { csrf } from "@/lib/auth";
import { authorizeResource } from "@/lib/record-access";
import { refreshAmcOpportunities } from "@/lib/opportunities";
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const user = await authorizeResource("amc-opportunities", true);
    return Response.json(await refreshAmcOpportunities(user.id));
  });
}
