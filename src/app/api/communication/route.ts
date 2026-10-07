import { z } from "zod";
import { api, AppError, json } from "@/lib/errors";
import { authorize, csrf, audit } from "@/lib/auth";
import { authorizeResource } from "@/lib/record-access";
import { db } from "@/lib/db";
import { collection, delegate } from "@/lib/resources";
import { emailConfigured, emailProvider } from "@/lib/email";
const schema = z
  .object({
    recipient: z.email(),
    subject: z.string().trim().min(1).max(500),
    text: z.string().trim().min(1).max(10000),
    relatedModule: z.enum(["rfqs", "invoices", "amcs", "tickets", "tenders"]),
    recordId: z.string().min(1),
    confirmed: z.literal(true),
    requestId: z.uuid(),
  })
  .strict();
export async function GET() {
  return api(async () => {
    await authorize("communication");
    return Response.json({
      emailConfigured: emailConfigured(),
      automaticSending: false,
      attachments: false,
    });
  });
}
export async function POST(req: Request) {
  return api(async () => {
    csrf(req);
    const user = await authorize("communication", true),
      d = schema.parse(await json(req));
    await authorizeResource(d.relatedModule, true);
    const name = collection(d.relatedModule);
    if (!(await delegate(name).findUnique({ where: { id: d.recordId } })))
      throw new AppError(404, "Related record not found");
    const provider = emailProvider();
    let log = await db.mailLog.findUnique({ where: { id: d.requestId } });
    if (log) {
      if (
        log.senderId !== user.id ||
        log.recipient !== d.recipient ||
        log.subject !== d.subject ||
        log.recordId !== d.recordId ||
        log.relatedModule !== name
      )
        throw new AppError(
          409,
          "This request reference belongs to another message",
        );
      if (log.status === "SENT")
        return Response.json({ id: log.id, status: log.status });
      throw new AppError(
        409,
        "This message was already attempted. Check provider history before sending a new message.",
      );
    }
    log = await db.mailLog.create({
      data: {
        id: d.requestId,
        recipient: d.recipient,
        subject: d.subject,
        relatedModule: name,
        recordId: d.recordId,
        senderId: user.id,
      },
    });
    try {
      const result = await provider.send({
        to: d.recipient,
        subject: d.subject,
        text: d.text,
        idempotencyKey: log.id,
      });
      await db.mailLog.update({
        where: { id: log.id },
        data: { status: "SENT", sentAt: new Date(), providerId: result.id },
      });
      await audit(user.id, "SEND_EMAIL", name, d.recordId, { mailId: log.id });
      return Response.json({ id: log.id, status: "SENT" });
    } catch (error) {
      await db.mailLog.update({
        where: { id: log.id },
        data: { status: "UNCONFIRMED" },
      });
      await audit(user.id, "EMAIL_UNCONFIRMED", name, d.recordId, {
        mailId: log.id,
      });
      throw error;
    }
  });
}
