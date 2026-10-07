import { timingSafeEqual } from "node:crypto";
import { api, AppError } from "@/lib/errors";
import { runReminders } from "@/lib/reminders";
export async function GET(req: Request) {
  return api(async () => {
    const secret = process.env.CRON_SECRET;
    const supplied = req.headers.get("authorization") ?? "";
    const expected = "Bearer " + secret;
    if (
      !secret ||
      supplied.length !== expected.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    )
      throw new AppError(401, "Unauthorized");
    return Response.json(await runReminders());
  });
}
