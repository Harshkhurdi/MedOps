import { z } from "zod";
import {
  text,
  optionalText,
  optionalId,
  date,
  optionalDate,
  cash,
  provenance,
  signedMoney,
} from "./commercial";
import type { ModuleConfig } from "./ui-config";
import { field as f, relation as r } from "./controls";
import { historicalFields } from "./commercial-config";
import { cents } from "./business";
export const costCategories = [
  "MANUFACTURER_PURCHASE",
  "FREIGHT",
  "INSURANCE",
  "INSTALLATION",
  "TRAVEL",
  "LODGING",
  "ACCESSORIES",
  "WARRANTY_SUPPORT",
  "SERVICE",
  "SPARE_PARTS",
  "TENDER_FEES",
  "BANK_CHARGES",
  "OTHER",
] as const;
export const salesStages = [
  "IDENTIFIED",
  "REVIEWING",
  "QUALIFIED",
  "QUOTE_REQUESTED",
  "QUOTE_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;
export const revenueSchemas = {
  "customer-contacts": z
    .object({
      customerId: text,
      name: text,
      designation: optionalText,
      department: optionalText,
      phone: optionalText,
      email: z.email().nullable().optional(),
      preferredChannel: z
        .enum(["EMAIL", "PHONE", "WHATSAPP", "OTHER"])
        .default("EMAIL"),
      active: z.boolean().default(true),
      notes: optionalText,
      ...provenance,
    })
    .strict(),
  interactions: z
    .object({
      customerId: text,
      contactId: optionalId,
      employeeId: text,
      type: z.enum([
        "CALL",
        "MEETING",
        "EMAIL",
        "VISIT",
        "TENDER",
        "SERVICE",
        "PAYMENT",
        "OTHER",
      ]),
      occurredAt: date,
      nextFollowUp: optionalDate,
      relatedModule: optionalId,
      recordId: optionalId,
      notes: text,
    })
    .strict(),
  pipeline: z
    .object({
      title: text,
      type: z.enum([
        "TENDER",
        "AMC",
        "CONSUMABLE",
        "REPLACEMENT",
        "NEW_EQUIPMENT",
        "SERVICE",
        "OTHER",
      ]),
      stage: z.enum(salesStages).default("IDENTIFIED"),
      customerId: text,
      manufacturerId: optionalId,
      productId: optionalId,
      tenderId: optionalId,
      estimatedValue: cash.nullable().optional(),
      probability: z.coerce
        .number()
        .int()
        .min(0)
        .max(100)
        .nullable()
        .optional(),
      expectedClose: optionalDate,
      assignedToId: optionalId,
      notes: optionalText,
    })
    .strict(),
  competitors: z
    .object({
      company: text,
      brands: optionalText,
      categories: optionalText,
      notes: optionalText,
    })
    .strict(),
  "competitor-customers": z
    .object({
      competitorId: text,
      customerId: text,
      category: optionalText,
      notes: optionalText,
    })
    .strict(),
  costs: z
    .object({
      title: text,
      category: z.enum(costCategories),
      amount: cash,
      incurredDate: date,
      customerId: text,
      manufacturerId: optionalId,
      productId: optionalId,
      tenderId: optionalId,
      orderId: optionalId,
      deliveryId: optionalId,
      installationId: optionalId,
      ticketId: optionalId,
      employeeId: optionalId,
      serviceCost: z.boolean().default(false),
      postSale: z.boolean().default(false),
      notes: optionalText,
      ...provenance,
    })
    .strict(),
  adjustments: z
    .object({
      invoiceId: text,
      paymentId: optionalId,
      type: z.enum(["INVOICE_CREDIT", "INVOICE_DEBIT", "PAYMENT_REVERSAL"]),
      amount: cash.refine((v) => cents(v) > 0n, "Adjustment must be positive"),
      taxAmount: cash.default("0"),
      adjustmentDate: date,
      reference: text,
      reason: text,
      confirmed: z.literal(true),
    })
    .strict(),
};
const identity = { select: { id: true, name: true } } as const;
export const revenueResources = {
  "customer-contacts": {
    model: "customerContact",
    search: ["name", "department", "phone", "email", "notes"],
    include: { customer: identity },
  },
  interactions: {
    model: "customerInteraction",
    search: ["type", "notes"],
    include: { customer: identity, contact: identity },
  },
  pipeline: {
    model: "salesOpportunity",
    search: ["title", "stage", "type", "notes"],
    include: {
      customer: identity,
      manufacturer: identity,
      product: identity,
      tender: { select: { id: true, number: true } },
    },
  },
  competitors: {
    model: "competitor",
    search: ["company", "brands", "categories", "notes"],
    include: {},
  },
  "competitor-customers": {
    model: "competitorCustomer",
    search: ["category", "notes"],
    include: {
      customer: identity,
      competitor: { select: { id: true, company: true } },
    },
  },
  costs: {
    model: "operationalCost",
    search: ["title", "category", "notes"],
    include: {
      customer: identity,
      manufacturer: identity,
      product: identity,
      order: { select: { id: true, number: true } },
      ticket: { select: { id: true, number: true } },
    },
  },
  adjustments: {
    model: "financialAdjustment",
    search: ["reference", "type", "reason"],
    include: {
      invoice: { select: { id: true, number: true, customerId: true } },
      payment: { select: { id: true, reference: true, amount: true } },
    },
  },
} as const;
const notes = f("notes", "Notes", "textarea");
const active = { ...f("active", "Active", "boolean"), default: true };
export const revenueConfigs: Record<string, ModuleConfig> = {
  "customer-contacts": {
    title: "Customer contacts",
    createLabel: "Add Contact",
    description:
      "Hospital departments and actual contact details, entered manually.",
    columns: ["name", "customer", "department", "phone", "email", "active"],
    fields: [
      r("customerId", "Customer", "customers", true),
      f("name", "Contact name", "text", true),
      f("designation", "Designation"),
      f("department", "Department"),
      f("phone", "Phone"),
      f("email", "Email", "email"),
      {
        ...f("preferredChannel", "Preferred channel", "select", true, [
          "EMAIL",
          "PHONE",
          "WHATSAPP",
          "OTHER",
        ]),
        default: "EMAIL",
      },
      active,
      notes,
      ...historicalFields,
    ],
  },
  interactions: {
    title: "Customer interactions",
    createLabel: "New Interaction",
    description:
      "Calls, meetings, visits and follow-ups, with an optional related record.",
    columns: [
      "customer",
      "contact",
      "type",
      "occurredAt",
      "nextFollowUp",
      "employeeId",
    ],
    fields: [
      r("customerId", "Customer", "customers", true),
      r("contactId", "Customer contact (optional)", "customer-contacts"),
      r("employeeId", "Employee", "employees", true),
      f("type", "Interaction type", "select", true, [
        "CALL",
        "MEETING",
        "EMAIL",
        "VISIT",
        "TENDER",
        "SERVICE",
        "PAYMENT",
        "OTHER",
      ]),
      f("occurredAt", "Date/time", "datetime-local", true),
      f("nextFollowUp", "Next follow-up", "datetime-local"),
      f("relatedModule", "Related module (optional)"),
      f("recordId", "Related record ID (optional)"),
      f("notes", "Interaction notes", "textarea", true),
    ],
  },
  pipeline: {
    title: "Sales pipeline",
    createLabel: "New Sales Opportunity",
    description:
      "Track actual opportunities. Values and probabilities remain blank until a person enters them.",
    columns: [
      "title",
      "type",
      "stage",
      "customer",
      "manufacturer",
      "estimatedValue",
      "probability",
      "expectedClose",
    ],
    fields: [
      f("title", "Opportunity title", "text", true),
      f("type", "Opportunity type", "select", true, [
        "TENDER",
        "AMC",
        "CONSUMABLE",
        "REPLACEMENT",
        "NEW_EQUIPMENT",
        "SERVICE",
        "OTHER",
      ]),
      {
        ...f("stage", "Stage", "select", true, salesStages),
        default: "IDENTIFIED",
      },
      r("customerId", "Customer", "customers", true),
      r("manufacturerId", "Manufacturer", "manufacturers"),
      r("productId", "Product", "products"),
      r("tenderId", "Tender (optional)", "tenders"),
      f("estimatedValue", "Manually estimated value (INR)", "number"),
      f("probability", "Human-entered probability (%)", "number"),
      f("expectedClose", "Expected close", "date"),
      r("assignedToId", "Assigned employee", "employees"),
      notes,
    ],
  },
  competitors: {
    title: "Competitors",
    createLabel: "New Competitor",
    description:
      "Manually entered or publicly known information. Unknown prices are left blank.",
    columns: ["company", "brands", "categories"],
    fields: [
      f("company", "Company", "text", true),
      f("brands", "Known brands"),
      f("categories", "Categories"),
      notes,
    ],
  },
  "competitor-customers": {
    title: "Competitor / customer history",
    description: "Actual known customer and category associations.",
    columns: ["competitor", "customer", "category"],
    fields: [
      r("competitorId", "Competitor", "competitors", true),
      r("customerId", "Customer", "customers", true),
      f("category", "Category"),
      notes,
    ],
  },
  costs: {
    title: "Operational costs",
    createLabel: "New Cost",
    description:
      "Enter actual recorded costs. Operational contribution reporting does not replace accounting software.",
    columns: [
      "title",
      "category",
      "amount",
      "incurredDate",
      "customer",
      "order",
      "serviceCost",
      "postSale",
    ],
    fields: [
      f("title", "Cost description", "text", true),
      f("category", "Category", "select", true, costCategories),
      f("amount", "Amount (INR)", "number", true),
      f("incurredDate", "Incurred date", "date", true),
      r("customerId", "Customer", "customers", true),
      r("manufacturerId", "Manufacturer (optional)", "manufacturers"),
      r("productId", "Product (optional)", "products"),
      r("tenderId", "Tender (optional)", "tenders"),
      r("orderId", "Purchase order (optional)", "orders"),
      r("deliveryId", "Delivery (optional)", "deliveries"),
      r("installationId", "Installation (optional)", "installations"),
      r("ticketId", "Service ticket (optional)", "tickets"),
      r("employeeId", "Employee (optional)", "employees"),
      f("serviceCost", "Service cost", "boolean"),
      f("postSale", "Post-sale cost", "boolean"),
      notes,
      ...historicalFields,
    ],
  },
  adjustments: {
    title: "Audited financial corrections",
    createLabel: "New Financial Correction",
    description:
      "Credit/debit notes and payment reversals retain originals. A reason, confirmation and adjustment permission are required.",
    immutable: true,
    columns: [
      "invoice",
      "payment",
      "type",
      "amount",
      "taxAmount",
      "adjustmentDate",
      "reference",
      "reason",
    ],
    fields: [
      r("invoiceId", "Invoice", "invoices", true),
      r("paymentId", "Payment (only for reversal)", "payments"),
      f("type", "Correction type", "select", true, [
        "INVOICE_CREDIT",
        "INVOICE_DEBIT",
        "PAYMENT_REVERSAL",
      ]),
      f("amount", "Base amount / reversed receipt (INR)", "number", true),
      {
        ...f("taxAmount", "Tax amount (zero for reversal)", "number", true),
        default: "0",
      },
      f("adjustmentDate", "Correction date", "date", true),
      f("reference", "Correction reference", "text", true),
      f("reason", "Reason", "textarea", true),
      f("confirmed", "I confirm this financial correction", "boolean"),
    ],
  },
};
export type Adjustment = { type: string; amount: unknown; taxAmount?: unknown };
export function invoiceLedger(
  total: unknown,
  payments: { amount: unknown }[],
  adjustments: Adjustment[] = [],
) {
  let charged = cents(String(total)),
    received = payments.reduce((s, p) => s + cents(String(p.amount)), 0n);
  for (const a of adjustments) {
    const base = cents(String(a.amount));
    if (a.type === "PAYMENT_REVERSAL") received -= base;
    else {
      const value = base + cents(String(a.taxAmount ?? 0));
      charged += a.type === "INVOICE_DEBIT" ? value : -value;
    }
  }
  return { charged, received, outstanding: charged - received };
}
export function operationalContribution(revenue: bigint, costs: bigint) {
  const contribution = revenue - costs;
  return {
    revenue: signedMoney(revenue),
    recordedCosts: signedMoney(costs),
    grossContribution: signedMoney(contribution),
    contributionMarginPercent: revenue
      ? (Number((contribution * 1000000n) / revenue) / 10000).toFixed(4)
      : null,
  };
}
