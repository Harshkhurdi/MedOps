import { z } from "zod";
import { cents } from "./business";
import { AppError } from "./errors";

export const rfqStatuses = [
  "DRAFT",
  "READY_TO_SEND",
  "SENT",
  "AWAITING_RESPONSE",
  "QUOTE_RECEIVED",
  "REVISION_REQUESTED",
  "FINAL_QUOTE_RECEIVED",
  "CLOSED",
  "CANCELLED",
] as const;
export const text = z.string().trim().min(1).max(500);
export const optionalText = z.string().trim().max(10000).nullable().optional();
export const optionalId = text.nullable().optional();
export const date = z.coerce.date();
export const optionalDate = date.nullable().optional();
export const cash = z
  .union([z.string(), z.number()])
  .transform(String)
  .refine(
    (v) => /^\d{1,12}(\.\d{1,2})?$/.test(v),
    "Use a nonnegative amount with up to two decimal places",
  );
export const quantity = z.coerce.number().int().min(1).max(1000000);
export const provenance = {
  historical: z.boolean().default(false),
  originalDate: optionalDate,
  recordSource: z
    .enum([
      "MANUAL",
      "PDF_ASSISTED",
      "SYSTEM_GENERATED",
      "FUTURE_IMPORT",
      "FUTURE_ACCOUNTING_SYNC",
    ])
    .default("MANUAL"),
};
const cost = cash.default("0");
export const commercialSchemas = {
  decisions: z
    .object({
      tenderId: text,
      decision: z.enum(["PENDING_REVIEW", "PURSUE", "REJECT", "REVIEW_LATER"]),
      reason: optionalText,
      notes: optionalText,
      confirmed: z.boolean().optional(),
    })
    .strict(),
  "manufacturer-contacts": z
    .object({
      manufacturerId: text,
      name: text,
      designation: optionalText,
      department: optionalText,
      email: z.email().nullable().optional(),
      phone: optionalText,
      whatsapp: optionalText,
      region: optionalText,
      category: optionalText,
      preferredChannel: z
        .enum(["EMAIL", "PHONE", "WHATSAPP", "OTHER"])
        .default("EMAIL"),
      active: z.boolean().default(true),
      notes: optionalText,
    })
    .strict(),
  rfqs: z
    .object({
      number: text,
      tenderId: optionalId,
      customerId: optionalId,
      manufacturerId: text,
      contactId: optionalId,
      productId: optionalId,
      productName: text,
      model: optionalText,
      quantity,
      accessories: optionalText,
      warrantyRequirement: optionalText,
      deliveryLocation: optionalText,
      requiredDeliveryTime: optionalText,
      tenderDeadline: optionalDate,
      quoteRequiredBy: optionalDate,
      assignedToId: optionalId,
      status: z.enum(rfqStatuses).default("DRAFT"),
      sentAt: optionalDate,
      notes: optionalText,
      ...provenance,
    })
    .strict(),
  "rfq-followups": z
    .object({
      rfqId: text,
      employeeId: optionalId,
      contactDate: date,
      nextDate: optionalDate,
      notes: text,
    })
    .strict(),
  quotes: z
    .object({
      previousQuoteId: optionalId,
      number: text,
      manufacturerId: text,
      rfqId: optionalId,
      tenderId: optionalId,
      productId: optionalId,
      quotationDate: date,
      validityDate: optionalDate,
      currency: z
        .string()
        .regex(/^[A-Z]{3}$/)
        .default("INR"),
      productName: text,
      model: optionalText,
      quantity,
      unitPrice: cash,
      taxAmount: cost,
      accessories: optionalText,
      accessoriesCost: cost,
      freight: cost,
      installation: cost,
      warranty: optionalText,
      warrantyCost: cost,
      extendedWarrantyCost: cost,
      otherCosts: cost,
      discount: cost,
      finalManufacturerPrice: cash.nullable().optional(),
      leadTimeDays: z.coerce
        .number()
        .int()
        .min(0)
        .max(3650)
        .nullable()
        .optional(),
      paymentTerms: optionalText,
      isFinal: z.boolean().default(false),
      notes: optionalText,
      ...provenance,
    })
    .strict(),
  comparisons: z
    .object({
      name: text,
      tenderId: optionalId,
      rfqId: optionalId,
      quoteId: optionalId,
      currency: z
        .string()
        .regex(/^[A-Z]{3}$/)
        .default("INR"),
      procurementCost: cash.nullable().optional(),
      additionalCosts: cost,
      sellingPrice: cash,
      leadTimeDays: z.coerce
        .number()
        .int()
        .min(0)
        .max(3650)
        .nullable()
        .optional(),
      notes: optionalText,
    })
    .strict(),
  results: z
    .object({
      tenderId: text,
      outcome: z.enum(["WON", "LOST", "CANCELLED", "NO_BID"]),
      resultDate: date,
      winner: optionalText,
      winningPrice: cash.nullable().optional(),
      competitorName: optionalText,
      competitorId:optionalId,
      reason: optionalText,
      notes: optionalText,
      ...provenance,
    })
    .strict(),
};
const identity = { select: { id: true, name: true } } as const;
const tender = {
  select: { id: true, number: true, customerId: true },
} as const;
const rfq = {
  select: { id: true, number: true, manufacturerId: true, tenderId: true },
} as const;
export const commercialResources = {
  decisions: {
    model: "tenderDecision",
    search: ["decision", "reason", "notes"],
    include: { tender },
  },
  "manufacturer-contacts": {
    model: "manufacturerContact",
    search: ["name", "email", "phone", "region"],
    include: { manufacturer: identity },
  },
  rfqs: {
    model: "rfq",
    search: ["number", "productName", "model", "notes"],
    include: {
      manufacturer: identity,
      customer: identity,
      tender,
      contact: identity,
      product: identity,
      assignee: identity,
      followUps: true,
      files: { select: { id: true, name: true, version: true } },
    },
  },
  "rfq-followups": {
    model: "rfqFollowUp",
    search: ["notes"],
    include: { rfq },
  },
  quotes: {
    model: "quotationRevision",
    search: ["number", "productName", "model", "notes"],
    include: {
      series: {
        include: { manufacturer: identity, product: identity, rfq, tender },
      },
      files: { select: { id: true, name: true, version: true } },
    },
  },
  comparisons: {
    model: "commercialComparison",
    search: ["name", "notes"],
    include: {
      tender,
      rfq,
      quote: { include: { series: { include: { manufacturer: identity } } } },
    },
  },
  results: {
    model: "tenderResult",
    search: ["outcome", "winner", "competitorName", "reason"],
    include: { tender },
  },
} as const;
export function rfqTransition(from: string, to: string) {
  if (from === to) return;
  const transitions: Record<string, string[]> = {
    DRAFT: ["READY_TO_SEND", "CANCELLED"],
    READY_TO_SEND: ["DRAFT", "SENT", "CANCELLED"],
    SENT: ["AWAITING_RESPONSE", "QUOTE_RECEIVED", "CANCELLED"],
    AWAITING_RESPONSE: ["QUOTE_RECEIVED", "CANCELLED"],
    QUOTE_RECEIVED: [
      "REVISION_REQUESTED",
      "FINAL_QUOTE_RECEIVED",
      "CLOSED",
      "CANCELLED",
    ],
    REVISION_REQUESTED: ["QUOTE_RECEIVED", "FINAL_QUOTE_RECEIVED", "CANCELLED"],
    FINAL_QUOTE_RECEIVED: ["REVISION_REQUESTED", "CLOSED", "CANCELLED"],
    CLOSED: [],
    CANCELLED: [],
  };
  if (!transitions[from]?.includes(to))
    throw new AppError(400, `RFQ cannot move from ${from} to ${to}`);
}
export function signedMoney(value: bigint) {
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? "-" : ""}${absolute / 100n}.${String(absolute % 100n).padStart(2, "0")}`;
}
export function commercialCalculation(
  cost: string,
  extra: string,
  selling: string,
) {
  const total = cents(cost) + cents(extra),
    revenue = cents(selling),
    contribution = revenue - total;
  return {
    totalCost: signedMoney(total),
    contribution: signedMoney(contribution),
    marginPercent: revenue
      ? (Number((contribution * 1000000n) / revenue) / 10000).toFixed(4)
      : null,
  };
}
