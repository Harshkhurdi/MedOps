import { z } from "zod";
import {
  text,
  optionalText,
  optionalId,
  optionalDate,
  cash,
  provenance,
} from "./commercial";
import type { Field, ModuleConfig } from "./ui-config";
import { historicalFields } from "./commercial-config";
export const securityStatuses = [
  "PLANNED",
  "ISSUED",
  "SUBMITTED",
  "ACTIVE",
  "REFUND_REQUESTED",
  "REFUND_PENDING",
  "REFUNDED",
  "RELEASED",
  "EXPIRED",
  "INVOKED",
  "CANCELLED",
] as const;
export const approvalWorkflows = [
  "TENDER_PURSUE",
  "FINAL_BID_PRICE",
  "RFQ",
  "QUOTE_SELECTION",
  "PO_ACCEPTANCE",
  "LARGE_DISCOUNT",
  "PAYMENT_ADJUSTMENT",
  "CREDIT_TERMS",
  "AMC_QUOTATION",
  "TENDER_CANCELLATION",
  "INVENTORY_ADJUSTMENT",
] as const;
const sections = [
  "COMMERCIAL",
  "TECHNICAL",
  "MANUFACTURER",
  "COMPANY_DOCUMENTATION",
  "SUBMISSION",
  "CUSTOM",
] as const;
const checklistStatuses = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETE",
  "NOT_APPLICABLE",
  "BLOCKED",
] as const;
export const controlSchemas = {
  securities: z
    .object({
      type: z.enum([
        "EMD",
        "BID_SECURITY",
        "PBG",
        "SECURITY_DEPOSIT",
        "WARRANTY_GUARANTEE",
        "OTHER",
      ]),
      tenderId: optionalId,
      orderId: optionalId,
      customerId: text,
      bank: optionalText,
      reference: text,
      amount: cash,
      issueDate: optionalDate,
      validityDate: optionalDate,
      claimExpiry: optionalDate,
      expectedRefundDate: optionalDate,
      actualRefundDate: optionalDate,
      assignedToId: optionalId,
      status: z.enum(securityStatuses).default("PLANNED"),
      notes: optionalText,
      ...provenance,
    })
    .strict(),
  checklist: z
    .object({
      tenderId: text,
      section: z.enum(sections),
      title: text,
      status: z.enum(checklistStatuses).default("PENDING"),
      assignedToId: optionalId,
      notes: optionalText,
    })
    .strict(),
  "approval-policies": z
    .object({
      workflow: z.enum(approvalWorkflows),
      preventSelf: z.boolean().default(true),
      approverRole: z.enum(["ADMIN", "EMPLOYEE"]).default("ADMIN"),
      notes: optionalText,
    })
    .strict(),
  approvals: z
    .object({
      title: text,
      workflow: z.enum(approvalWorkflows),
      relatedModule: text,
      recordId: text,
      approverId: text,
      status: z
        .enum([
          "CREATED",
          "SUBMITTED",
          "APPROVED",
          "REJECTED",
          "CHANGES_REQUESTED",
        ])
        .default("CREATED"),
      comments: optionalText,
    })
    .strict(),
  mail: z.object({}).strict(),
};
const identity = { select: { id: true, name: true } } as const;
export const controlResources = {
  securities: {
    model: "security",
    search: ["reference", "bank", "notes"],
    include: {
      customer: identity,
      tender: { select: { id: true, number: true } },
      order: { select: { id: true, number: true } },
      files: { select: { id: true, name: true, version: true } },
    },
  },
  checklist: {
    model: "bidChecklist",
    search: ["title", "section", "notes"],
    include: { tender: { select: { id: true, number: true } } },
  },
  "approval-policies": {
    model: "approvalPolicy",
    search: ["workflow", "notes"],
    include: {},
  },
  approvals: {
    model: "approval",
    search: ["title", "workflow", "comments"],
    include: { events: true },
  },
  mail: {
    model: "mailLog",
    search: ["recipient", "subject", "status"],
    include: {},
  },
} as const;
export const field = (
  key: string,
  label: string,
  type: Field["type"] = "text",
  required = false,
  options?: readonly string[],
  source?: string,
): Field => ({ key, label, type, required, options, source });
export const relation = (
  key: string,
  label: string,
  source: string,
  required = false,
) => field(key, label, "relation", required, undefined, source);
const note = field("notes", "Notes", "textarea");
export const controlConfigs: Record<string, ModuleConfig> = {
  securities: {
    title: "Securities / EMD / PBG",
    createLabel: "New Security",
    description:
      "Track blocked amounts, expiry and actual refunds. Enter records manually, with optional tender or order links.",
    files: true,
    columns: [
      "reference",
      "type",
      "customer",
      "amount",
      "status",
      "validityDate",
      "expectedRefundDate",
    ],
    fields: [
      field("type", "Security type", "select", true, [
        "EMD",
        "BID_SECURITY",
        "PBG",
        "SECURITY_DEPOSIT",
        "WARRANTY_GUARANTEE",
        "OTHER",
      ]),
      relation("tenderId", "Tender (optional)", "tenders"),
      relation("orderId", "Purchase order (optional)", "orders"),
      relation("customerId", "Customer", "customers", true),
      field("bank", "Bank"),
      field("reference", "Reference", "text", true),
      field("amount", "Amount (INR)", "number", true),
      field("issueDate", "Issue date", "date"),
      field("validityDate", "Validity date", "date"),
      field("claimExpiry", "Claim expiry", "date"),
      field("expectedRefundDate", "Expected refund date", "date"),
      field("actualRefundDate", "Actual refund date", "date"),
      relation("assignedToId", "Responsible employee", "employees"),
      {
        ...field("status", "Status", "select", true, securityStatuses),
        default: "PLANNED",
      },
      note,
      ...historicalFields,
    ],
  },
  checklist: {
    title: "Bid submission checklist",
    createLabel: "New Checklist Item",
    description:
      "Commercial, technical, manufacturer, company and submission checks. Employees explicitly confirm each item; no automatic compliance decisions.",
    columns: ["tender", "section", "title", "status"],
    fields: [
      relation("tenderId", "Tender", "tenders", true),
      field("section", "Section", "select", true, sections),
      field("title", "Checklist item", "text", true),
      {
        ...field("status", "Status", "select", true, checklistStatuses),
        default: "PENDING",
      },
      relation("assignedToId", "Responsible employee", "employees"),
      note,
    ],
  },
  "approval-policies": {
    title: "Approval policies",
    description:
      "Administrator configuration of approver role and self-approval rules for each workflow.",
    columns: ["workflow", "preventSelf", "approverRole"],
    fields: [
      field("workflow", "Workflow", "select", true, approvalWorkflows),
      {
        ...field("preventSelf", "Prevent self-approval", "boolean"),
        default: true,
      },
      {
        ...field("approverRole", "Approver role", "select", true, [
          "ADMIN",
          "EMPLOYEE",
        ]),
        default: "ADMIN",
      },
      note,
    ],
  },
  approvals: {
    title: "Approvals",
    createLabel: "New Approval",
    description:
      "Create, submit and decide requests against a retained record version. Only the assigned authorized approver can decide.",
    columns: [
      "title",
      "workflow",
      "relatedModule",
      "status",
      "submittedAt",
      "decisionAt",
    ],
    fields: [
      field("title", "Approval title", "text", true),
      field("workflow", "Workflow", "select", true, approvalWorkflows),
      field("relatedModule", "Related module", "text", true),
      field("recordId", "Related record ID", "text", true),
      relation("approverId", "Approver", "employees", true),
      {
        ...field("status", "Approval status", "select", true, [
          "CREATED",
          "SUBMITTED",
          "APPROVED",
          "REJECTED",
          "CHANGES_REQUESTED",
        ]),
        default: "CREATED",
      },
      field("comments", "Comments", "textarea"),
    ],
  },
  mail: {
    title: "Email history",
    description:
      "Only explicitly requested messages are sent. Provider credentials remain in secure environment variables.",
    readOnly: true,
    columns: ["recipient", "subject", "relatedModule", "status", "sentAt"],
    fields: [],
  },
};
export function checklistProgress(rows: { status: string }[]) {
  const applicable = rows.filter((r) => r.status !== "NOT_APPLICABLE");
  return {
    complete: applicable.filter((r) => r.status === "COMPLETE").length,
    total: applicable.length,
    percent: applicable.length
      ? Math.round(
          (applicable.filter((r) => r.status === "COMPLETE").length * 100) /
            applicable.length,
        )
      : 0,
  };
}
