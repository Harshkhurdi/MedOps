import { serviceResources } from "./service-operations";
import { controlResources } from "./controls";
import { schemas, type Resource } from "./schemas";
import { commercialResources } from "./commercial";
import { db } from "./db";
import { AppError } from "./errors";
// Linked records expose only the identification and operational fields needed
// by the owning workflow. Reading equipment or deliveries must not grant prices.
const customerSummary = {
  select: {
    id: true,
    name: true,
    address: true,
    state: true,
    phone: true,
    contactName: true,
  },
} as const;
const manufacturerSummary = { select: { id: true, name: true } } as const;
const tenderSummary = {
  select: { id: true, number: true, customerId: true, status: true },
} as const;
const orderSummary = {
  select: {
    id: true,
    number: true,
    customerId: true,
    status: true,
    deliveryDeadline: true,
  },
} as const;
const itemSummary = {
  select: {
    id: true,
    equipment: true,
    model: true,
    quantity: true,
    manufacturerId: true,
  },
} as const;
const equipmentSummary = {
  select: {
    id: true,
    serialNumber: true,
    orderItemId: true,
    deliveryId: true,
    customerId: true,
    orderId: true,
  },
} as const;
const amcSummary = {
  select: {
    id: true,
    number: true,
    customerId: true,
    status: true,
    nextServiceDate: true,
  },
} as const;
const invoiceSummary = {
  select: {
    id: true,
    number: true,
    customerId: true,
    orderId: true,
    dueDate: true,
  },
} as const;
export const resources = {
  ...commercialResources,
  ...controlResources,
  ...serviceResources,
  tasks: {
    model: "task",
    search: ["title", "notes"],
    include: { assignee: { select: { id: true, name: true } } },
  },
  company: { model: "companyProfile", search: ["legalName"], include: {} },
  customers: { model: "customer", search: ["name", "state"], include: {} },
  manufacturers: { model: "manufacturer", search: ["name"], include: {} },
  products: {
    model: "product",
    search: ["name", "model"],
    include: { manufacturer: manufacturerSummary },
  },
  documents: {
    model: "companyDocument",
    search: ["name", "category"],
    include: {
      manufacturer: manufacturerSummary,
      files: { select: { id: true, name: true, version: true } },
    },
  },
  tenders: {
    model: "tender",
    search: ["number", "category"],
    include: {
      customer: customerSummary,
      items: { include: { manufacturer: manufacturerSummary } },
      requirements: true,
      history: true,
      files: { select: { id: true, name: true } },
      generated: { select: { id: true, reviewedAt: true } },
    },
  },
  requirements: {
    model: "tenderRequirement",
    search: ["requirement", "specification"],
    include: {
      tender: tenderSummary,
      files: { select: { id: true, name: true } },
    },
  },
  templates: {
    model: "documentTemplate",
    search: ["name", "kind"],
    include: {},
  },
  orders: {
    model: "purchaseOrder",
    search: ["number"],
    include: {
      customer: customerSummary,
      tender: tenderSummary,
      items: true,
      files: { select: { id: true, name: true } },
    },
  },
  deliveries: {
    model: "delivery",
    search: ["location", "tracking"],
    include: {
      order: orderSummary,
      items: true,
      files: { select: { id: true, name: true } },
    },
  },
  equipment: {
    model: "equipment",
    search: ["serialNumber", "productName", "model", "location", "department"],
    include: {
      manufacturer: manufacturerSummary,
      product: { select: { id: true, name: true, model: true } },
      orderItem: itemSummary,
      customer: customerSummary,
      delivery: true,
      installation: true,
    },
  },
  installations: {
    model: "installation",
    search: ["status"],
    include: { equipment: equipmentSummary },
  },
  warranties: {
    model: "warranty",
    search: ["terms"],
    include: {
      history: true,
      equipment: {
        include: { orderItem: itemSummary, customer: customerSummary },
      },
      files: { select: { id: true, name: true } },
    },
  },
  amcs: {
    model: "amcContract",
    search: ["number", "status"],
    include: {
      customer: customerSummary,
      equipment: { include: { equipment: equipmentSummary } },
      visits: true,
      files: { select: { id: true, name: true } },
    },
  },
  visits: {
    model: "serviceVisit",
    search: ["status", "complaint"],
    include: { amc: amcSummary, files: { select: { id: true, name: true } } },
  },
  invoices: {
    model: "invoice",
    search: ["number"],
    include: {
      customer: customerSummary,
      order: orderSummary,
      payments: true,
      followUps: true,
      files: { select: { id: true, name: true } },
    },
  },
  payments: {
    model: "payment",
    search: ["reference", "method"],
    include: { invoice: invoiceSummary },
  },
  followups: {
    model: "paymentFollowUp",
    search: ["notes"],
    include: { invoice: invoiceSummary },
  },
  users: {
    model: "user",
    search: ["name", "email"],
    include: { permissions: true },
  },
  notifications: {
    model: "notification",
    search: ["title", "priority"],
    include: {},
  },
  audit: {
    model: "auditLog",
    search: ["action", "module"],
    include: { user: { select: { name: true, email: true } } },
  },
  generated: {
    model: "generatedDocument",
    search: ["format"],
    include: {
      file: { select: { id: true, name: true } },
      tender: tenderSummary,
      template: { select: { id: true, name: true, kind: true } },
    },
  },
} as const;
export type Collection = keyof typeof resources;
export function collection(name: string): Collection {
  if (!Object.hasOwn(resources, name))
    throw new AppError(404, "Module not found");
  return name as Collection;
}
export interface Delegate {
  findMany(args: object): Promise<Record<string, unknown>[]>;
  findUnique(args: object): Promise<Record<string, unknown> | null>;
  count(args: object): Promise<number>;
  create(args: object): Promise<Record<string, unknown>>;
  update(args: object): Promise<Record<string, unknown>>;
  delete(args: object): Promise<Record<string, unknown>>;
}
export function delegate(name: Collection, client: object = db) {
  return (client as Record<string, unknown>)[resources[name].model] as Delegate;
}
export function parseResource(name: Collection, value: unknown) {
  if (!Object.hasOwn(schemas, name))
    throw new AppError(405, "Use the dedicated workflow for this module");
  return schemas[name as Resource].parse(value) as Record<string, unknown>;
}
