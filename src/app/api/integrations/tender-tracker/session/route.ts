import { z } from "zod";
import { api } from "@/lib/errors";
import {
  exchangeCode,
  grantActor,
  limitedBody,
  parsed,
  rateLimit,
  verifySignature,
} from "@/lib/integrations/tender-tracker";
const input = z.union([
  z.object({ code: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict(),
  z.object({ grant: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict(),
]);
export async function POST(req: Request) {
  return api(async () => {
    const body = await limitedBody(req);
    verifySignature(req, body);
    await rateLimit("session", 120);
    const data = input.parse(parsed(body));
    if ("code" in data) return Response.json(await exchangeCode(data.code));
    await grantActor(data.grant);
    return Response.json({ connected: true });
  });
}
