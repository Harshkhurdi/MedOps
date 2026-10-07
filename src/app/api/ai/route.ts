import { api, AppError, json } from "@/lib/errors";
import { authorize, csrf, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiConfiguration, reserveAiRequest } from "@/lib/ai-config";
import { aiInput, aiDayStart, openRouterCompletion } from "@/lib/ai";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET() {
  return api(async () => {
    const user = await authorize("ai");
    const config = await aiConfiguration();
    const used = await db.aiRequest.count({
      where: { userId: user.id, createdAt: { gte: aiDayStart() } },
    });
    return Response.json({
      ...config,
      used,
      remaining: Math.max(0, config.aiDailyLimit - used),
    });
  });
}
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const user = await authorize("ai", true),
      data = aiInput.parse(await json(req));
    const config = await aiConfiguration();
    if (!config.available)
      throw new AppError(
        503,
        "AI is disabled or its key/model has not been configured. All other features remain available.",
      );
    if (config.providerLoggingAllowed && !data.nonConfidential)
      throw new AppError(
        400,
        "Confirm that your text contains no confidential or personal information",
      );
    const reservation = await reserveAiRequest(
      user.id,
      data,
      config.aiDailyLimit,
    );
    try {
      await audit(user.id, "AI_REQUEST_CONSENT", "ai", reservation.id, {
        purpose: data.purpose,
        inputCharacters: data.text.length,
        providerLoggingAllowed: config.providerLoggingAllowed,
        nonConfidentialConfirmed: data.nonConfidential === true,
      });
      const result = await openRouterCompletion(
        data,
        config.aiModel,
        config.aiMaxOutputTokens,
        process.env.OPENROUTER_API_KEY!,
        fetch,
        config.providerLoggingAllowed,
      );
      await db.aiRequest.update({
        where: { id: reservation.id },
        data: {
          status: "SUCCEEDED",
          outputTokens: result.outputTokens,
          costUsd: result.costUsd,
        },
      });
      return Response.json({
        ...result,
        requiresReview: true,
        remaining: Math.max(
          0,
          config.aiDailyLimit -
            (await db.aiRequest.count({
              where: { userId: user.id, createdAt: { gte: aiDayStart() } },
            })),
        ),
      });
    } catch (error) {
      await db.aiRequest.update({
        where: { id: reservation.id },
        data: { status: "FAILED" },
      });
      throw error;
    }
  });
}
