import { AppError } from "./errors";
import { digest } from "./auth";
import { aiDayStart, providerLoggingAllowed, type AiInput } from "./ai";
import { db } from "./db";
export async function aiConfiguration() {
  const saved = await db.appSettings.findUnique({ where: { id: "main" } });
  const model = saved?.aiModel || process.env.OPENROUTER_MODEL || "";
  const configured = Boolean(process.env.OPENROUTER_API_KEY && model);
  return {
    aiEnabled: saved?.aiEnabled ?? false,
    aiModel: model,
    aiDailyLimit: saved?.aiDailyLimit ?? 10,
    aiMaxOutputTokens: saved?.aiMaxOutputTokens ?? 1200,
    configured,
    available: configured && Boolean(saved?.aiEnabled),
    provider: "OpenRouter",
    providerLoggingAllowed: providerLoggingAllowed(model),
  };
}

export async function reserveAiRequest(
  userId: string,
  data: AiInput,
  limit: number,
) {
  return db.$transaction(
    async (tx) => {
      const used = await tx.aiRequest.count({
        where: { userId, createdAt: { gte: aiDayStart() } },
      });
      if (used >= limit)
        throw new AppError(429, "Your daily AI request limit is reached");
      if (
        await tx.aiRequest.count({
          where: {
            userId,
            status: "PENDING",
            createdAt: { gte: new Date(Date.now() - 120000) },
          },
        })
      )
        throw new AppError(
          429,
          "An AI request is already running. Wait for it to finish",
        );
      return tx.aiRequest.create({
        data: {
          userId,
          purpose: data.purpose,
          promptHash: digest(data.text),
          inputCharacters: data.text.length,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}
