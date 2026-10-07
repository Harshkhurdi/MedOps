import { api, AppError, json } from "@/lib/errors";
import { authorize, csrf, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiConfiguration } from "@/lib/ai-config";
import {
  aiSettingsInput,
  nvidiaFreeModel,
  providerLoggingAllowed,
} from "@/lib/ai";
export async function GET() {
  return api(async () => {
    const user = await authorize("settings");
    await db.$queryRaw`SELECT 1`;
    const config = await aiConfiguration();
    return Response.json({
      aiStatus: config.available ? "Enabled" : "Disabled",
      aiProvider: "OpenRouter",
      externalDataProcessing: config.available
        ? "Only explicitly entered text after consent"
        : "Disabled",
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
      administrator: user.role === "ADMIN",
      ai: config,
    });
  });
}
export async function PATCH(req: Request) {
  return api(async () => {
    csrf(req);
    const user = await authorize("settings", true);
    if (user.role !== "ADMIN")
      throw new AppError(403, "Administrator access required");
    const data = aiSettingsInput.parse(await json(req));
    if (data.aiEnabled && (!process.env.OPENROUTER_API_KEY || !data.aiModel))
      throw new AppError(
        400,
        "Configure the private OpenRouter key and choose a model before enabling AI",
      );
    if (
      data.aiEnabled &&
      data.aiModel === nvidiaFreeModel &&
      !providerLoggingAllowed(data.aiModel)
    )
      throw new AppError(
        400,
        "This free NVIDIA model logs submitted text. The account owner must approve non-confidential-only mode before the operator enables it, or choose a zero-retention model.",
      );
    await db.appSettings.upsert({
      where: { id: "main" },
      create: { id: "main", ...data },
      update: data,
    });
    await audit(user.id, "UPDATE_AI_SETTINGS", "settings", "main", {
      enabled: data.aiEnabled,
      model: data.aiModel,
      dailyLimit: data.aiDailyLimit,
    });
    return Response.json({
      message: "AI settings saved",
      ...(await aiConfiguration()),
    });
  });
}
