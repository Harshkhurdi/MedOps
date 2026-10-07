import { api } from "@/lib/errors";
import { authorizeResource } from "@/lib/record-access";
import { managementReport } from "@/lib/management";
export async function GET(req: Request) {
  return api(async () => {
    const params = new URL(req.url).searchParams;
    const user = await authorizeResource(
      params.get("view") === "profitability"
        ? "profitability"
        : params.get("view") === "executive"
          ? "executive"
          : "analytics",
    );
    return Response.json(await managementReport(user, params));
  });
}
