import { api, AppError } from "@/lib/errors";
import { currentUser, can } from "@/lib/auth";
import { collection, delegate } from "@/lib/resources";
const selections: Record<string, object> = {
  customers: { id: true, name: true, address: true },
  manufacturers: { id: true, name: true },
  tenders: {
    id: true,
    number: true,
    customerId: true,
    status: true,
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
  equipment: { id: true, serialNumber: true, customerId: true },
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
  products: ["manufacturers"],
  documents: ["manufacturers"],
  company: ["documents"],
  tenders: ["customers", "manufacturers"],
  requirements: ["tenders"],
  orders: ["tenders", "customers", "manufacturers"],
  deliveries: ["orders"],
  equipment: ["deliveries", "orders", "customers"],
  installations: ["equipment"],
  warranties: ["equipment"],
  amcs: ["customers", "equipment", "amcs"],
  visits: ["amcs"],
  invoices: ["orders", "customers"],
  payments: ["invoices"],
  followups: ["invoices"],
};
const searchFields: Record<string, string> = {
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
        can(user, name) ||
        (dependencies[workflow]?.includes(name) && can(user, workflow, true))
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
