import { api } from "@/lib/errors";
import { authorize, csrf } from "@/lib/auth";
import { runReminders } from "@/lib/reminders";
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    await authorize("settings", true);
    return Response.json(await runReminders());
  });
}
