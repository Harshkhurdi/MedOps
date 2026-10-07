import type { Prisma } from "@/generated/prisma/client";
import { can, type Actor } from "./auth";
import { AppError } from "./errors";
import { collection, delegate } from "./resources";
import { canResource } from "./record-access";
const workflowModules: Record<string, string[]> = {
  TENDER_PURSUE: ["tenders", "decisions"],
  FINAL_BID_PRICE: ["comparisons", "tenders"],
  RFQ: ["rfqs"],
  QUOTE_SELECTION: ["quotes", "comparisons"],
  PO_ACCEPTANCE: ["orders"],
  LARGE_DISCOUNT: ["orders", "comparisons"],
  PAYMENT_ADJUSTMENT: ["invoices", "payments"],
  CREDIT_TERMS: ["customers", "orders"],
  AMC_QUOTATION: ["amcs"],
  TENDER_CANCELLATION: ["tenders"],
  INVENTORY_ADJUSTMENT: ["parts"],
};
export async function prepareControls(
  tx: Prisma.TransactionClient,
  name: string,
  data: Record<string, unknown>,
  user: Actor,
  old: Record<string, unknown> | null,
) {
  if (["mail"].includes(name))
    throw new AppError(405, "Use the explicit Send email action");
  if (name === "approval-policies" && user.role !== "ADMIN")
    throw new AppError(403, "Administrator access required");
  for (const field of ["assignedToId", "approverId"])
    if (
      data[field] &&
      !(await tx.user.findFirst({
        where: { id: String(data[field]), active: true },
      }))
    )
      throw new AppError(400, "Choose an active employee");
  if (name === "securities") {
    for (const [field, model] of [
      ["tenderId", "tenders"],
      ["orderId", "orders"],
    ] as const)
      if (data[field]) {
        const row = await delegate(model, tx).findUnique({
          where: { id: String(data[field]) },
        });
        if (!row || (row.customerId && row.customerId !== data.customerId))
          throw new AppError(
            400,
            "Security customer must match its linked tender/order",
          );
      }
    if (data.orderId && data.tenderId) {
      const order = await tx.purchaseOrder.findUniqueOrThrow({
        where: { id: String(data.orderId) },
      });
      if (order.tenderId && order.tenderId !== data.tenderId)
        throw new AppError(400, "Security order and tender do not match");
    }
    for (const field of [
      "validityDate",
      "claimExpiry",
      "expectedRefundDate",
      "actualRefundDate",
    ])
      if (data.issueDate && data[field] && data[field]! < data.issueDate)
        throw new AppError(400, "Security dates cannot precede issue date");
    if (
      data.claimExpiry &&
      data.validityDate &&
      data.claimExpiry < data.validityDate
    )
      throw new AppError(400, "Claim expiry cannot precede validity");
    if (data.status === "REFUNDED" && !data.actualRefundDate)
      throw new AppError(400, "Record the actual refund date");
    if (data.actualRefundDate && data.status !== "REFUNDED")
      throw new AppError(400, "Actual refund date requires Refunded status");
    if (
      old &&
      ["REFUNDED", "RELEASED", "INVOKED", "CANCELLED"].includes(
        String(old.status),
      ) &&
      old.status !== data.status
    )
      throw new AppError(409, "Closed security status cannot be reopened");
    if (old && old.status !== "PLANNED")
      for (const field of [
        "amount",
        "reference",
        "type",
        "customerId",
        "tenderId",
        "orderId",
      ])
        if (String(old[field] ?? "") !== String(data[field] ?? ""))
          throw new AppError(
            409,
            "Issued security identity and amount are immutable",
          );
  }
  if (name === "checklist") {
    if (!(await tx.tender.findUnique({ where: { id: String(data.tenderId) } })))
      throw new AppError(400, "Tender not found");
  }
  if (name === "approvals") {
    const relatedModule = collection(String(data.relatedModule));
    if (!workflowModules[String(data.workflow)]?.includes(relatedModule))
      throw new AppError(
        400,
        "Related module does not match approval workflow",
      );
    if (!canResource(user, relatedModule))
      throw new AppError(403, "Access to the related record is required");
    const entity = await delegate(relatedModule, tx).findUnique({
      where: { id: String(data.recordId) },
    });
    if (!entity) throw new AppError(400, "Related record not found");
    const policy = await tx.approvalPolicy.findUnique({
      where: { workflow: String(data.workflow) },
    });
    const approver = await tx.user.findUniqueOrThrow({
      where: { id: String(data.approverId) },
      include: { permissions: true },
    });
    if (
      approver.role !== (policy?.approverRole ?? "ADMIN") ||
      !can(approver, "approval-decide", true) ||
      !canResource(approver, relatedModule)
    )
      throw new AppError(
        400,
        "Approver does not have the configured role and decision permissions",
      );
    if (!old) {
      if (data.status !== "CREATED")
        throw new AppError(400, "Create the approval before submitting it");
      data.createdById = user.id;
      data.relevantVersion = entity.updatedAt;
    } else {
      for (const f of ["relatedModule", "recordId", "workflow"])
        if (data[f] !== old[f])
          throw new AppError(409, "Approval relationships are immutable");
      const previous = String(old.status),
        next = String(data.status);
      if (["APPROVED", "REJECTED"].includes(previous))
        throw new AppError(
          405,
          "Approval decisions are immutable; create a new request",
        );
      if (previous === "SUBMITTED") {
        if (old.approverId !== data.approverId)
          throw new AppError(409, "Submitted approver cannot be changed");
        if (!["APPROVED", "REJECTED", "CHANGES_REQUESTED"].includes(next))
          throw new AppError(400, "Submitted approvals require a decision");
        if (old.approverId !== user.id || !can(user, "approval-decide", true))
          throw new AppError(
            403,
            "Only the assigned authorized approver can decide",
          );
        if ((policy?.preventSelf ?? true) && old.submittedById === user.id)
          throw new AppError(
            403,
            "Self-approval is disabled for this workflow",
          );
        if (
          (old.relevantVersion instanceof Date
            ? old.relevantVersion
            : new Date(String(old.relevantVersion))
          ).getTime() !==
          (entity.updatedAt instanceof Date
            ? entity.updatedAt
            : new Date(String(entity.updatedAt))
          ).getTime()
        )
          throw new AppError(
            409,
            "Related record changed after submission; create a new approval",
          );
        if (!data.comments)
          throw new AppError(400, "Decision comments are required");
        data.decisionById = user.id;
        data.decisionAt = new Date();
      } else {
        if (old.createdById !== user.id && user.role !== "ADMIN")
          throw new AppError(
            403,
            "Only the creator can submit or revise this request",
          );
        if (!["CREATED", "SUBMITTED"].includes(next))
          throw new AppError(400, "Submit the request before deciding");
        data.relevantVersion = entity.updatedAt;
        if (next === "SUBMITTED") {
          data.submittedById = user.id;
          data.submittedAt = new Date();
          data.decisionById = null;
          data.decisionAt = null;
        }
      }
    }
    data.events = {
      create: {
        fromStatus: old?.status ?? null,
        toStatus: data.status,
        actorId: user.id,
        comments: data.comments ?? null,
        relevantVersion: data.relevantVersion ?? old?.relevantVersion,
      },
    };
  }
  return data;
}
