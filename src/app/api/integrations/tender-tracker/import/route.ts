import { api } from "@/lib/errors";
import {
  importTender,
  limitedBody,
  parsed,
  recordFailure,
  verifySignature,
} from "@/lib/integrations/tender-tracker";
export const runtime = "nodejs";
export async function POST(req: Request) {
  let authenticated = false;
  const response = await api(async () => {
    const body = await limitedBody(req);
    verifySignature(req, body);
    authenticated = true;
    return Response.json(await importTender(parsed(body)));
  });
  if (authenticated && !response.ok)
    await recordFailure(response.status).catch(() => {});
  return response;
}
