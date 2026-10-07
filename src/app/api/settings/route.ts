import { api } from "@/lib/errors";
import { authorize } from "@/lib/auth";
import { db } from "@/lib/db";
export async function GET() {
  return api(async () => {
    await authorize("settings");
    await db.$queryRaw`SELECT 1`;
    return Response.json({
      aiStatus: "Disabled",
      aiProvider: "None",
      externalDataProcessing: "Disabled",
      database: "Connected",
      storage:
        process.env.STORAGE_DRIVER === "blob"
          ? "Private Vercel Blob"
          : process.env.VERCEL
            ? "Not configured"
            : "Private local storage",
      timezone: "Asia/Kolkata",
      fileLimit: "4 MB",
      sessionDuration: "8 hours",
    });
  });
}
