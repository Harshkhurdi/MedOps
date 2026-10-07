import { commercialSchemas } from "./commercial";
import { z } from "zod";
const text = z.string().trim().min(1).max(500);
const notes = z.string().max(10000).optional().nullable();
const id = text;
const optionalId = id.optional().nullable();
const date = z.coerce.date();
const optionalDate = date.optional().nullable();
const cash = z
  .union([z.string(), z.number()])
  .transform(String)
  .refine(
    (v) => /^\d{1,12}(\.\d{1,2})?$/.test(v),
    "Use up to two decimal places",
  );
const qty = z.coerce.number().int().min(1).max(1000000);
const rate = cash.refine((v) => Number(v) <= 100, "Tax cannot exceed 100%");
export const tenderStatuses = [
  "DRAFT",
  "UNDER_REVIEW",
  "DOCUMENTS_IN_PROGRESS",
  "READY_FOR_SUBMISSION",
  "SUBMITTED",
  "WON",
  "LOST",
  "CANCELLED",
] as const;
export const orderStatuses = [
  "ORDER_RECEIVED",
  "MANUFACTURER_ORDER_PENDING",
  "MANUFACTURER_ORDER_PLACED",
  "PROCESSING",
  "READY_FOR_DISPATCH",
  "PARTIALLY_DELIVERED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;
const tenderItem = z
  .object({
    equipment: text,
    model: notes,
    quantity: qty,
    manufacturerId: optionalId,
  })
  .strict();
const orderItem = z
  .object({
    equipment: text,
    model: notes,
    quantity: qty,
    manufacturerId: optionalId,
    unitPrice: cash,
    taxRate: rate,
  })
  .strict();
export const schemas = {
  ...commercialSchemas,
  company: z
    .object({
      legalName: text,
      address: text,
      gstin: z
        .string()
        .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/)
        .optional()
        .nullable(),
      pan: z
        .string()
        .regex(/^[A-Z]{5}\d{4}[A-Z]$/)
        .optional()
        .nullable(),
      email: z.email().optional().nullable(),
      phone: notes,
      signatory: notes,
      designation: notes,
      declarations: notes,
      additionalFields: z.record(z.string(), z.string()).optional(),
      reminderDays: z.coerce.number().int().min(1).max(365).default(30),
      logoFileId: optionalId,
      letterheadFileId: optionalId,
    })
    .strict(),
  customers: z
    .object({
      name: text,
      institutionType: notes,
      address: notes,
      state: notes,
      email: z.email().optional().nullable(),
      phone: notes,
      contactName: notes,
      notes,
    })
    .strict(),
  manufacturers: z
    .object({
      name: text,
      email: z.email().optional().nullable(),
      phone: notes,
      contactName: notes,
      notes,
    })
    .strict(),
  products: z
    .object({
      name: text,
      model: text,
      category: notes,
      manufacturerId: id,
      specifications: notes,
    })
    .strict(),
  documents: z
    .object({
      name: text,
      category: text,
      issueDate: optionalDate,
      expiryDate: optionalDate,
      manufacturerId: optionalId,
      notes,
      active: z.boolean().default(true),
    })
    .strict(),
  tenders: z
    .object({
      number: text,
      gemUrl: z
        .url()
        .refine((v) => {
          const u = new URL(v);
          return (
            u.protocol === "https:" &&
            (u.hostname === "gem.gov.in" || u.hostname.endsWith(".gem.gov.in"))
          );
        }, "Use an HTTPS GeM URL")
        .optional()
        .nullable(),
      customerId: optionalId,
      bidNumber: notes,
      title: notes,
      state: notes,
      source: notes,
      sourceUrl: z.url().nullable().optional(),
      publicationDate: optionalDate,
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
      category: notes,
      deadline: optionalDate,
      emd: cash.optional().nullable(),
      estimatedValue: cash.optional().nullable(),
      warrantyTerms: notes,
      deliveryTerms: notes,
      notes,
      status: z.enum(tenderStatuses).default("DRAFT"),
      items: z.array(tenderItem).max(100).default([]),
    })
    .strict(),
  requirements: z
    .object({
      tenderId: id,
      requirement: text,
      specification: notes,
      compliance: z
        .enum(["COMPLIES", "DOES_NOT_COMPLY", "REQUIRES_REVIEW"])
        .default("REQUIRES_REVIEW"),
      evidenceNotes: notes,
    })
    .strict(),
  templates: z
    .object({
      name: text,
      kind: z.enum([
        "RFQ_LETTER",
        "COVERING_LETTER",
        "NON_BLACKLISTING",
        "WARRANTY_UNDERTAKING",
        "AUTHORIZATION_REQUEST",
        "COMPLIANCE_STATEMENT",
        "COMPLIANCE_COMPARISON",
        "CHECKLIST",
        "DELIVERY_CHALLAN",
        "PACKING_LIST",
        "INSTALLATION_REPORT",
        "COMMISSIONING_REPORT",
        "HANDOVER",
        "PAYMENT_REMINDER",
        "CUSTOM",
      ]),
      body: z.string().min(1).max(50000),
      approved: z.boolean().default(false),
    })
    .strict(),
  orders: z
    .object({
      number: text,
      tenderId: optionalId,
      customerId: id,
      poDate: date,
      deliveryDeadline: optionalDate,
      paymentTerms: notes,
      notes,
      status: z.enum(orderStatuses).default("ORDER_RECEIVED"),
      confirmed: z.boolean().default(false),
      items: z.array(orderItem).min(1).max(100),
    })
    .strict(),
  deliveries: z
    .object({
      orderId: id,
      dispatchDate: optionalDate,
      transporter: notes,
      tracking: notes,
      expectedDate: optionalDate,
      actualDate: optionalDate,
      location: text,
      confirmed: z.boolean().default(false),
      notes,
      items: z
        .array(z.object({ orderItemId: id, quantity: qty }).strict())
        .min(1)
        .max(100),
    })
    .strict(),
  equipment: z
    .object({
      serialNumber: text,
      orderId: id,
      orderItemId: id,
      deliveryId: id,
      customerId: id,
    })
    .strict(),
  installations: z
    .object({
      equipmentId: id,
      status: z
        .enum(["PENDING", "PARTIAL", "INSTALLED", "COMMISSIONED", "ACCEPTED"])
        .default("PENDING"),
      installationDate: optionalDate,
      commissioningDate: optionalDate,
      acceptanceDate: optionalDate,
      notes,
    })
    .strict(),
  warranties: z
    .object({
      equipmentId: id,
      commencement: z.enum([
        "DELIVERY",
        "INSTALLATION",
        "COMMISSIONING",
        "ACCEPTANCE",
      ]),
      durationMonths: z.coerce.number().int().min(1).max(240),
      terms: text,
      notes,
    })
    .strict(),
  amcs: z
    .object({
      number: text,
      customerId: id,
      startDate: date,
      endDate: date,
      amount: cash,
      serviceFrequencyMonths: z.coerce.number().int().min(1).max(60),
      nextServiceDate: optionalDate,
      responsibleName: notes,
      status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]).default("ACTIVE"),
      notes,
      renewedFromId: optionalId,
      equipmentIds: z.array(id).min(1).max(100),
    })
    .strict(),
  visits: z
    .object({
      amcId: id,
      employeeId: optionalId,
      scheduledDate: date,
      completedDate: optionalDate,
      status: z
        .enum(["SCHEDULED", "COMPLETED", "COMPLAINT", "CANCELLED"])
        .default("SCHEDULED"),
      complaint: notes,
      notes,
    })
    .strict(),
  invoices: z
    .object({
      number: text,
      customerId: id,
      orderId: id,
      invoiceDate: date,
      amount: cash,
      taxAmount: cash,
      paymentTermDays: z.coerce.number().int().min(0).max(730),
      notes,
    })
    .strict(),
  payments: z
    .object({
      invoiceId: id,
      amount: cash.refine(
        (v) => Number(v) > 0,
        "Payment must be greater than zero",
      ),
      paymentDate: date,
      reference: text,
      method: z.enum(["BANK_TRANSFER", "CHEQUE", "CASH", "OTHER"]),
      notes,
    })
    .strict(),
  followups: z
    .object({
      invoiceId: id,
      employeeId: optionalId,
      contactDate: date,
      nextDate: optionalDate,
      notes: text,
    })
    .strict(),
  users: z
    .object({
      email: z.email().transform((v) => v.toLowerCase()),
      name: text,
      password: z.string().min(12).max(256).optional(),
      role: z.enum(["ADMIN", "EMPLOYEE"]),
      active: z.boolean().default(true),
      permissions: z
        .array(
          z
            .object({ module: text, read: z.boolean(), write: z.boolean() })
            .strict(),
        )
        .max(100)
        .default([]),
    })
    .strict(),
  tasks: z
    .object({
      title: text,
      notes,
      assignedToId: optionalId,
      dueDate: optionalDate,
      status: z
        .enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"])
        .default("OPEN"),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
    })
    .strict(),
  notifications: z
    .object({ read: z.boolean().optional(), dismiss: z.boolean().optional() })
    .strict(),
};
export type Resource = keyof typeof schemas;
