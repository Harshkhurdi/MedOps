import { schemas, type Resource } from "./schemas";
import { db } from "./db";
import { AppError } from "./errors";
export const resources = {
  company: { model: "companyProfile", search: ["legalName"], include: {} },
  customers: { model: "customer", search: ["name", "state"], include: {} },
  manufacturers: { model: "manufacturer", search: ["name"], include: {} },
  products: {
    model: "product",
    search: ["name", "model"],
    include: { manufacturer: true },
  },
  documents: {
    model: "companyDocument",
    search: ["name", "category"],
    include: {
      manufacturer: true,
      files: { select: { id: true, name: true, version: true } },
    },
  },
  tenders: {
    model: "tender",
    search: ["number", "category"],
    include: {
      customer: true,
      items: { include: { manufacturer: true } },
      requirements: true,
      history: true,
      files: { select: { id: true, name: true } },
      generated: { select: { id: true, reviewedAt: true } },
    },
  },
  requirements: {
    model: "tenderRequirement",
    search: ["requirement", "specification"],
    include: { tender: true, files: { select: { id: true, name: true } } },
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
      customer: true,
      tender: true,
      items: true,
      files: { select: { id: true, name: true } },
    },
  },
  deliveries: {
    model: "delivery",
    search: ["location", "tracking"],
    include: {
      order: true,
      items: true,
      files: { select: { id: true, name: true } },
    },
  },
  equipment: {
    model: "equipment",
    search: ["serialNumber"],
    include: {
      orderItem: true,
      customer: true,
      delivery: true,
      installation: true,
    },
  },
  installations: {
    model: "installation",
    search: ["status"],
    include: { equipment: true },
  },
  warranties: {
    model: "warranty",
    search: ["terms"],
    include: {
      history: true,
      equipment: { include: { orderItem: true, customer: true } },
      files: { select: { id: true, name: true } },
    },
  },
  amcs: {
    model: "amcContract",
    search: ["number", "status"],
    include: {
      customer: true,
      equipment: { include: { equipment: true } },
      visits: true,
      files: { select: { id: true, name: true } },
    },
  },
  visits: {
    model: "serviceVisit",
    search: ["status", "complaint"],
    include: { amc: true, files: { select: { id: true, name: true } } },
  },
  invoices: {
    model: "invoice",
    search: ["number"],
    include: {
      customer: true,
      order: true,
      payments: true,
      followUps: true,
      files: { select: { id: true, name: true } },
    },
  },
  payments: {
    model: "payment",
    search: ["reference", "method"],
    include: { invoice: true },
  },
  followups: {
    model: "paymentFollowUp",
    search: ["notes"],
    include: { invoice: true },
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
      tender: true,
      template: true,
    },
  },
} as const;
export type Collection = keyof typeof resources;
export function collection(name: string): Collection {
  if (!(name in resources)) throw new AppError(404, "Module not found");
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
  if (!(name in schemas))
    throw new AppError(405, "Use the dedicated workflow for this module");
  return schemas[name as Resource].parse(value) as Record<string, unknown>;
}
