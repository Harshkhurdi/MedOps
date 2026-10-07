import { canResource } from "@/lib/record-access";
import { api, AppError } from "@/lib/errors";
import { currentUser } from "@/lib/auth";
import { collection, delegate } from "@/lib/resources";
const selections: Record<string, object> = {
  "customer-contacts": { id: true, name: true, customerId: true, active: true },
  competitors: { id: true, company: true },
  payments: { id: true, reference: true, invoiceId: true },
  "sla-rules": { id: true, name: true, active: true },
  parts: {
    id: true,
    sku: true,
    name: true,
    onHand: true,
    reserved: true,
    active: true,
  },
  consumables: { id: true, name: true, sku: true, active: true },
  tickets: {
    id: true,
    number: true,
    customerId: true,
    equipmentId: true,
    assignedToId: true,
  },
  "ticket-visits": {
    id: true,
    ticketId: true,
    scheduledAt: true,
    workDone: true,
  },
  rfqs: {
    id: true,
    number: true,
    manufacturerId: true,
    customerId: true,
    tenderId: true,
    productId: true,
    productName: true,
    model: true,
    quantity: true,
    warrantyRequirement: true,
    deliveryLocation: true,
    quoteRequiredBy: true,
  },
  quotes: { id: true, number: true, seriesId: true, revision: true },
  products: { id: true, name: true, model: true, manufacturerId: true },
  "manufacturer-contacts": {
    id: true,
    name: true,
    manufacturerId: true,
    active: true,
  },
  customers: { id: true, name: true, address: true },
  manufacturers: { id: true, name: true },
  tenders: {
    id: true,
    number: true,
    customerId: true,
    status: true,
    title: true,
    warrantyTerms: true,
    deadline: true,
    deliveryTerms: true,
    items: {
      select: {
        equipment: true,
        model: true,
        manufacturerId: true,
        quantity: true,
      },
    },
  },
  orders: {
    id: true,
    number: true,
    customerId: true,
    status: true,
    confirmed: true,
    customer: { select: { address: true } },
    items: {
      select: {
        id: true,
        equipment: true,
        model: true,
        manufacturerId: true,
        quantity: true,
      },
    },
  },
  deliveries: {
    id: true,
    location: true,
    orderId: true,
    confirmed: true,
    actualDate: true,
    order: { select: { id: true, customerId: true } },
    items: { select: { orderItemId: true, quantity: true } },
  },
  equipment: {
    id: true,
    serialNumber: true,
    customerId: true,
    manufacturerId: true,
    productId: true,
    productName: true,
    model: true,
    department: true,
  },
  amcs: { id: true, number: true, customerId: true },
  invoices: { id: true, number: true },
  templates: { id: true, name: true, kind: true, approved: true },
  installations: {
    id: true,
    equipmentId: true,
    equipment: { select: { serialNumber: true } },
  },
  documents: {
    id: true,
    name: true,
    files: { select: { id: true, name: true, version: true } },
  },
};
const dependencies: Record<string, string[]> = {
  "customer-contacts": ["customers"],
  interactions: ["customers", "customer-contacts"],
  pipeline: ["customers", "manufacturers", "products", "tenders"],
  "competitor-customers": ["customers", "competitors"],
  costs: [
    "customers",
    "manufacturers",
    "products",
    "tenders",
    "orders",
    "deliveries",
    "installations",
    "tickets",
  ],
  adjustments: ["invoices", "payments"],
  tickets: ["customers", "equipment", "manufacturers", "sla-rules"],
  "ticket-visits": ["tickets"],
  "sla-rules": ["customers", "manufacturers", "amcs"],
  "amc-opportunities": ["customers", "equipment", "amcs"],
  consumables: ["manufacturers"],
  compatibility: ["products", "consumables"],
  "consumable-opportunities": ["customers", "equipment", "consumables"],
  parts: ["manufacturers"],
  inventory: ["parts", "tickets"],
  securities: ["tenders", "orders", "customers"],
  checklist: ["tenders"],
  approvals: [],
  decisions: ["tenders"],
  results: ["tenders", "competitors"],
  "manufacturer-contacts": ["manufacturers"],
  rfqs: [
    "manufacturers",
    "manufacturer-contacts",
    "products",
    "tenders",
    "customers",
  ],
  "rfq-followups": ["rfqs"],
  quotes: ["manufacturers", "products", "tenders", "rfqs", "quotes"],
  comparisons: ["tenders", "rfqs", "quotes"],
  products: ["manufacturers"],
  documents: ["manufacturers"],
  company: ["documents"],
  tenders: ["customers", "manufacturers", "products"],
  requirements: ["tenders"],
  orders: ["tenders", "customers", "manufacturers", "products"],
  deliveries: ["orders"],
  equipment: ["deliveries", "orders", "customers", "manufacturers", "products"],
  installations: ["equipment"],
  warranties: ["equipment"],
  amcs: ["customers", "equipment", "amcs"],
  visits: ["amcs"],
  invoices: ["orders", "customers"],
  payments: ["invoices"],
  followups: ["invoices"],
};
const searchFields: Record<string, string> = {
  "customer-contacts": "name",
  competitors: "company",
  payments: "reference",
  tickets: "number",
  "ticket-visits": "workDone",
  "sla-rules": "name",
  parts: "name",
  consumables: "name",
  rfqs: "number",
  quotes: "number",
  products: "name",
  "manufacturer-contacts": "name",
  customers: "name",
  manufacturers: "name",
  tenders: "number",
  orders: "number",
  deliveries: "location",
  equipment: "serialNumber",
  amcs: "number",
  invoices: "number",
  templates: "name",
  documents: "name",
};
export async function GET(
  req: Request,
  ctx: { params: Promise<{ module: string }> },
) {
  return api(async () => {
    const user = await currentUser();
    if (!user) throw new AppError(401, "Please sign in");
    const name = collection((await ctx.params).module),
      params = new URL(req.url).searchParams,
      workflow = params.get("for") ?? "";
    if (
      !selections[name] ||
      !(
        canResource(user, name) ||
        (dependencies[workflow]?.includes(name) &&
          canResource(user, workflow, true))
      )
    )
      throw new AppError(403, "Record selection permission is required");
    const q = (params.get("q") ?? "").slice(0, 200),
      ids = (params.get("ids") ?? "").split(",").filter(Boolean).slice(0, 100);
    const where: Record<string, unknown> = {};
    if (ids.length && q && searchFields[name])
      where.OR = [
        { id: { in: ids } },
        { [searchFields[name]]: { contains: q, mode: "insensitive" } },
      ];
    else if (ids.length) where.id = { in: ids };
    else if (q && searchFields[name])
      where[searchFields[name]] = { contains: q, mode: "insensitive" };
    if (name === "customer-contacts") {
      where.active = true;
      if (params.get("customerId")) where.customerId = params.get("customerId");
    }
    if (name === "payments" && params.get("invoiceId"))
      where.invoiceId = params.get("invoiceId");
    if (name === "manufacturer-contacts") {
      where.active = true;
      if (params.get("manufacturerId"))
        where.manufacturerId = params.get("manufacturerId");
    }
    if (name === "products" && params.get("manufacturerId"))
      where.manufacturerId = params.get("manufacturerId");
    if (name === "tenders" && workflow === "orders") where.status = "WON";
    if (name === "deliveries" && workflow === "equipment")
      where.confirmed = true;
    if (name === "equipment" && params.get("customerId"))
      where.customerId = params.get("customerId");
    return Response.json({
      rows: await delegate(name).findMany({
        where,
        select: selections[name],
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    });
  });
}
