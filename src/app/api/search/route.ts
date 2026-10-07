import { api } from "@/lib/errors";
import { authorizeResource } from "@/lib/record-access";
import { universalSearch } from "@/lib/search";
export async function GET(req: Request) {
  return api(async () => {
    const user = await authorizeResource("search");
    return Response.json({
      groups: await universalSearch(
        user,
        new URL(req.url).searchParams.get("q") ?? "",
      ),
    });
  });
}
