import { AppError } from "./errors";
export type MailInput = {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
};
export interface EmailProvider {
  send(message: MailInput): Promise<{ id: string }>;
}
export function emailConfigured() {
  return Boolean(
    process.env.EMAIL_PROVIDER === "resend" &&
    process.env.EMAIL_API_KEY &&
    process.env.EMAIL_FROM,
  );
}
export function emailProvider(): EmailProvider {
  if (!emailConfigured())
    throw new AppError(
      503,
      "Email is not configured. Use manual email or WhatsApp sharing.",
    );
  return {
    async send(message) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.EMAIL_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": message.idempotencyKey,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok)
        throw new AppError(
          502,
          "Email provider did not confirm sending. Check email history before retrying.",
        );
      const body = await r.json();
      if (typeof body.id !== "string")
        throw new AppError(
          502,
          "Email provider did not return a message reference.",
        );
      return { id: body.id };
    },
  };
}
