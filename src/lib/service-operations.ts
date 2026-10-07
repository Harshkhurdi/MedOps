import { z } from "zod";
import {
  text,
  optionalText,
  optionalId,
  date,
  optionalDate,
  cash,
  quantity,
  provenance,
} from "./commercial";
import type { ModuleConfig } from "./ui-config";
import { field as f, relation as r } from "./controls";
import { historicalFields } from "./commercial-config";
export const ticketStatuses = [
  "OPEN",
  "ASSIGNED",
  "VISIT_SCHEDULED",
  "IN_PROGRESS",
  "WAITING_FOR_PARTS",
  "WAITING_FOR_MANUFACTURER",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const;
export const opportunityStatuses = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "QUOTE_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
  "NOT_APPLICABLE",
] as const;
const optValue = cash.nullable().optional(),
  positiveHours = z.coerce.number().int().min(1).max(87600);
export const serviceSchemas = {
  tickets: z
    .object({
      number: text,
      customerId: text,
      equipmentId: optionalId,
      manufacturerId: optionalId,
      serialNumber: optionalText,
      productName: text,
      model: optionalText,
      department: optionalText,
      issue: text,
      priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
      reportedAt: date,
      contactName: optionalText,
      contactPhone: optionalText,
      assignedToId: optionalId,
      scheduledVisit: optionalDate,
      resolution: optionalText,
      resolvedAt: optionalDate,
      status: z.enum(ticketStatuses).default("OPEN"),
      slaRuleId: optionalId,
      notes: optionalText,
      ...provenance,
    })
    .strict(),
  "ticket-visits": z
    .object({
      ticketId: text,
      engineerId: text,
      scheduledAt: date,
      startedAt: optionalDate,
      completedAt: optionalDate,
      status: z
        .enum(["SCHEDULED", "STARTED", "COMPLETED", "CANCELLED"])
        .default("SCHEDULED"),
      workDone: optionalText,
      representative: optionalText,
      acknowledgement: optionalText,
      nextVisit: optionalDate,
      notes: optionalText,
    })
    .strict(),
  "sla-rules": z
    .object({
      name: text,
      customerId: optionalId,
      manufacturerId: optionalId,
      amcId: optionalId,
      warrantyType: optionalText,
      assignmentHours: positiveHours,
      firstVisitHours: positiveHours,
      resolutionHours: positiveHours,
      active: z.boolean().default(true),
      notes: optionalText,
    })
    .strict(),
  "amc-opportunities": z
    .object({
      customerId: text,
      equipmentId: text,
      amcId: optionalId,
      reason: text,
      triggerDate: optionalDate,
      status: z.enum(opportunityStatuses).default("NEW"),
      assignedToId: optionalId,
      followUpDate: optionalDate,
      estimatedValue: optValue,
      notes: optionalText,
    })
    .strict(),
  consumables: z
    .object({
      sku: text,
      name: text,
      manufacturerId: optionalId,
      active: z.boolean().default(true),
      notes: optionalText,
    })
    .strict(),
  compatibility: z
    .object({
      productId: text,
      consumableId: text,
      active: z.boolean().default(true),
      notes: optionalText,
    })
    .strict(),
  "consumable-opportunities": z
    .object({
      customerId: text,
      equipmentId: optionalId,
      consumableId: text,
      lastSale: optionalDate,
      lastQuantity: quantity.nullable().optional(),
      nextFollowUp: optionalDate,
      assignedToId: optionalId,
      status: z.enum(opportunityStatuses).default("NEW"),
      notes: optionalText,
    })
    .strict(),
  parts: z
    .object({
      sku: text,
      name: text,
      manufacturerId: optionalId,
      compatibleModels: optionalText,
      reorderLevel: z.coerce.number().int().min(0).max(1000000).default(0),
      unitCost: optValue,
      location: optionalText,
      supplier: optionalText,
      active: z.boolean().default(true),
      notes: optionalText,
    })
    .strict(),
  inventory: z
    .object({
      partId: text,
      type: z.enum([
        "IN",
        "OUT",
        "RESERVE",
        "RELEASE",
        "USED_IN_SERVICE",
        "RETURN",
        "ADJUSTMENT",
      ]),
      quantity: z.coerce
        .number()
        .int()
        .min(-1000000)
        .max(1000000)
        .refine((v) => v !== 0, "Quantity cannot be zero"),
      ticketId: optionalId,
      engineerId: optionalId,
      transactionDate: date,
      notes: optionalText,
      requestId: z.uuid(),
      fromReserved: z.boolean().default(false),
      allowNegative: z.boolean().default(false),
    })
    .strict(),
};
const identity = { select: { id: true, name: true } } as const;
const equipment = {
  select: {
    id: true,
    serialNumber: true,
    customerId: true,
    productName: true,
    model: true,
  },
} as const;
const ticket = {
  select: {
    id: true,
    number: true,
    customerId: true,
    equipmentId: true,
    assignedToId: true,
  },
} as const;
export const serviceResources = {
  tickets: {
    model: "serviceTicket",
    search: ["number", "serialNumber", "productName", "issue", "notes"],
    include: {
      customer: identity,
      equipment,
      manufacturer: identity,
      files: { select: { id: true, name: true, version: true } },
    },
  },
  "ticket-visits": {
    model: "ticketVisit",
    search: ["workDone", "representative", "notes", "status"],
    include: {
      ticket,
      files: { select: { id: true, name: true, version: true } },
    },
  },
  "sla-rules": {
    model: "slaRule",
    search: ["name", "warrantyType", "notes"],
    include: { customer: identity, manufacturer: identity },
  },
  "amc-opportunities": {
    model: "amcOpportunity",
    search: ["reason", "status", "notes"],
    include: {
      customer: identity,
      equipment,
      amc: { select: { id: true, number: true } },
    },
  },
  consumables: {
    model: "consumable",
    search: ["sku", "name", "notes"],
    include: { manufacturer: identity },
  },
  compatibility: {
    model: "consumableCompatibility",
    search: ["notes"],
    include: { product: identity, consumable: identity },
  },
  "consumable-opportunities": {
    model: "consumableOpportunity",
    search: ["notes", "status"],
    include: { customer: identity, equipment, consumable: identity },
  },
  parts: {
    model: "sparePart",
    search: ["sku", "name", "compatibleModels", "location", "supplier"],
    include: { manufacturer: identity },
  },
  inventory: {
    model: "inventoryTransaction",
    search: ["type", "notes"],
    include: { part: { select: { id: true, sku: true, name: true } }, ticket },
  },
} as const;
const notes = f("notes", "Notes", "textarea");
const active = { ...f("active", "Active", "boolean"), default: true };
const opportunityFields = [
  {
    ...f("status", "Status", "select", true, opportunityStatuses),
    default: "NEW",
  },
  r("assignedToId", "Assigned employee", "employees"),
  notes,
];
export const serviceConfigs: Record<string, ModuleConfig> = {
  tickets: {
    title: "Service tickets",
    createLabel: "New Service Ticket",
    description:
      "Create manually or for a saved device. Warranty and AMC dates are displayed from actual contracts; service does not alter them.",
    files: true,
    columns: [
      "number",
      "customer",
      "serialNumber",
      "priority",
      "status",
      "scheduledVisit",
      "resolvedAt",
    ],
    fields: [
      f("number", "Ticket number", "text", true),
      r("customerId", "Customer", "customers", true),
      r("equipmentId", "Installed equipment (optional)", "equipment"),
      r("manufacturerId", "Manufacturer", "manufacturers"),
      f("serialNumber", "Serial number"),
      f("productName", "Equipment/product", "text", true),
      f("model", "Model"),
      f("department", "Department"),
      f("issue", "Reported issue", "textarea", true),
      {
        ...f("priority", "Priority", "select", true, [
          "LOW",
          "NORMAL",
          "HIGH",
          "CRITICAL",
        ]),
        default: "NORMAL",
      },
      f("reportedAt", "Reported date/time", "datetime-local", true),
      f("contactName", "Contact name"),
      f("contactPhone", "Contact phone"),
      r("assignedToId", "Assigned engineer", "employees"),
      f("scheduledVisit", "Scheduled visit", "datetime-local"),
      f("resolution", "Resolution", "textarea"),
      f("resolvedAt", "Resolved date/time", "datetime-local"),
      {
        ...f("status", "Status", "select", true, ticketStatuses),
        default: "OPEN",
      },
      r("slaRuleId", "SLA rule (optional)", "sla-rules"),
      notes,
      ...historicalFields,
    ],
  },
  "ticket-visits": {
    title: "Engineer service visits",
    createLabel: "New Service Visit",
    description:
      "Record actual visit start, work, acknowledgement and completion. Attach photographs or a service report privately.",
    files: true,
    columns: ["ticket", "engineerId", "scheduledAt", "status", "completedAt"],
    fields: [
      r("ticketId", "Service ticket", "tickets", true),
      r("engineerId", "Engineer", "employees", true),
      f("scheduledAt", "Scheduled date/time", "datetime-local", true),
      f("startedAt", "Started date/time", "datetime-local"),
      f("completedAt", "Completed date/time", "datetime-local"),
      {
        ...f("status", "Status", "select", true, [
          "SCHEDULED",
          "STARTED",
          "COMPLETED",
          "CANCELLED",
        ]),
        default: "SCHEDULED",
      },
      f("workDone", "Work performed", "textarea"),
      f("representative", "Customer representative"),
      f("acknowledgement", "Acknowledgement", "textarea"),
      f("nextVisit", "Next visit", "datetime-local"),
      notes,
    ],
  },
  "sla-rules": {
    title: "Service SLA rules",
    description:
      "Optional administrator-defined assignment, first visit and resolution targets. Contracts determine the appropriate targets.",
    columns: [
      "name",
      "customer",
      "manufacturer",
      "assignmentHours",
      "firstVisitHours",
      "resolutionHours",
      "active",
    ],
    fields: [
      f("name", "Rule name", "text", true),
      r("customerId", "Customer (optional)", "customers"),
      r("manufacturerId", "Manufacturer (optional)", "manufacturers"),
      r("amcId", "AMC (optional)", "amcs"),
      f("warrantyType", "Warranty type (optional)"),
      f("assignmentHours", "Assignment target (hours)", "number", true),
      f("firstVisitHours", "First visit target (hours)", "number", true),
      f("resolutionHours", "Resolution target (hours)", "number", true),
      active,
      notes,
    ],
  },
  "amc-opportunities": {
    title: "AMC opportunities",
    createLabel: "New AMC Opportunity",
    description:
      "Actual warranty/AMC dates identify follow-up opportunities. Estimated value is entered by a person and never fabricated.",
    columns: [
      "customer",
      "equipment",
      "reason",
      "status",
      "followUpDate",
      "estimatedValue",
    ],
    fields: [
      r("customerId", "Customer", "customers", true),
      r("equipmentId", "Installed equipment", "equipment", true),
      r("amcId", "Existing AMC (optional)", "amcs"),
      f("reason", "Opportunity reason", "text", true),
      f("triggerDate", "Contract expiry / trigger date", "date"),
      f("followUpDate", "Next follow-up", "datetime-local"),
      f("estimatedValue", "Manually estimated value (INR)", "number"),
      ...opportunityFields,
    ],
  },
  consumables: {
    title: "Consumables catalogue",
    createLabel: "New Consumable",
    description:
      "Maintain actual products. No clinical usage assumptions are added.",
    columns: ["sku", "name", "manufacturer", "active"],
    fields: [
      f("sku", "SKU", "text", true),
      f("name", "Consumable name", "text", true),
      r("manufacturerId", "Manufacturer", "manufacturers"),
      active,
      notes,
    ],
  },
  compatibility: {
    title: "Product / consumable compatibility",
    createLabel: "New Compatibility",
    description:
      "Administrators explicitly define compatibility using manufacturer evidence.",
    columns: ["product", "consumable", "active"],
    fields: [
      r("productId", "Product", "products", true),
      r("consumableId", "Consumable", "consumables", true),
      active,
      notes,
    ],
  },
  "consumable-opportunities": {
    title: "Consumable opportunities",
    createLabel: "New Consumable Opportunity",
    description:
      "Manual repeat-sales follow-up based on approved compatibility. No automatic usage estimates.",
    columns: ["customer", "equipment", "consumable", "status", "nextFollowUp"],
    fields: [
      r("customerId", "Customer", "customers", true),
      r("equipmentId", "Installed equipment (optional)", "equipment"),
      r("consumableId", "Consumable", "consumables", true),
      f("lastSale", "Last sale date", "date"),
      f("lastQuantity", "Last quantity", "number"),
      f("nextFollowUp", "Next follow-up", "datetime-local"),
      ...opportunityFields,
    ],
  },
  parts: {
    title: "Spare parts",
    createLabel: "New Spare Part",
    description:
      "Stock balances change only through immutable inventory transactions. Cost access requires Pricing permission.",
    columns: [
      "sku",
      "name",
      "manufacturer",
      "availableQuantity",
      "reserved",
      "reorderLevel",
      "location",
      "active",
    ],
    fields: [
      f("sku", "SKU", "text", true),
      f("name", "Part name", "text", true),
      r("manufacturerId", "Manufacturer", "manufacturers"),
      f("compatibleModels", "Compatible models", "textarea"),
      { ...f("reorderLevel", "Reorder level", "number", true), default: 0 },
      f("unitCost", "Unit cost (INR)", "number"),
      f("location", "Storage location"),
      f("supplier", "Supplier"),
      active,
      notes,
    ],
  },
  inventory: {
    title: "Inventory transactions",
    createLabel: "New Stock Transaction",
    description:
      "Stock in/out, reservations, release and service use retain immutable history. Privileged adjustments require a reason.",
    immutable: true,
    columns: [
      "part",
      "type",
      "quantity",
      "ticket",
      "transactionDate",
      "onHandAfter",
      "reservedAfter",
    ],
    fields: [
      r("partId", "Part", "parts", true),
      f("type", "Transaction type", "select", true, [
        "IN",
        "OUT",
        "RESERVE",
        "RELEASE",
        "USED_IN_SERVICE",
        "RETURN",
        "ADJUSTMENT",
      ]),
      f("quantity", "Quantity (signed only for adjustment)", "number", true),
      r("ticketId", "Service ticket (required for service use)", "tickets"),
      r("engineerId", "Engineer", "employees"),
      f("transactionDate", "Transaction date/time", "datetime-local", true),
      notes,
      f("requestId", "Unique transaction reference", "text", true),
      f("fromReserved", "Consume reserved stock", "boolean"),
      f(
        "allowNegative",
        "Administrator confirmation of negative adjustment",
        "boolean",
      ),
    ],
  },
};
export function inventoryBalance(
  onHand: number,
  reserved: number,
  type: string,
  quantity: number,
  fromReserved = false,
) {
  if (type !== "ADJUSTMENT" && quantity <= 0)
    throw new Error("Quantity must be positive");
  let stock = onHand,
    held = reserved;
  switch (type) {
    case "IN":
    case "RETURN":
      stock += quantity;
      break;
    case "OUT":
    case "USED_IN_SERVICE":
      stock -= quantity;
      if (fromReserved) held -= quantity;
      break;
    case "RESERVE":
      held += quantity;
      break;
    case "RELEASE":
      held -= quantity;
      break;
    case "ADJUSTMENT":
      stock += quantity;
      break;
    default:
      throw new Error("Unknown stock transaction");
  }
  if (held < 0 || held > Math.max(stock, 0))
    throw new Error("Insufficient available or reserved stock");
  return { onHand: stock, reserved: held };
}
