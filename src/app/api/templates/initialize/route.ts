import { api } from "@/lib/errors";
import { authorize, csrf } from "@/lib/auth";
import { db } from "@/lib/db";
import { standardTemplates } from "@/lib/documents";
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const user = await authorize("settings", true);
    let count = 0;
    for (const [kind, t] of Object.entries(standardTemplates)) {
      if (!(await db.documentTemplate.findFirst({ where: { kind } }))) {
        await db.documentTemplate.create({
          data: { ...t, kind, approved: false },
        });
        count++;
      }
    }
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "INITIALIZE_DRAFT_TEMPLATES",
        module: "templates",
      },
    });
    return Response.json({ count });
  });
}
