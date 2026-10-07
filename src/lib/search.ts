import { type Actor } from "./auth";
import { canResource } from "./record-access";
import { delegate, collection, resources } from "./resources";
import { recordWhere } from "./record-query";
import { label } from "./ui-config";
import { db } from "./db";
export async function universalSearch(user: Actor, query: string) {
  const q = query.trim().slice(0, 200);
  if (q.length < 2) return [];
  const groups: {
    entity: string;
    results: { id: string; label: string; href: string }[];
  }[] = [];
  for (const key of [
    "tenders",
    "customers",
    "customer-contacts",
    "manufacturers",
    "manufacturer-contacts",
    "products",
    "orders",
    "invoices",
    "equipment",
    "rfqs",
    "tickets",
    "amcs",
    "securities",
    "parts",
    "pipeline",
  ]) {
    if (!canResource(user, key)) continue;
    const name = collection(key),
      where = await recordWhere(name, user, new URLSearchParams({ q }));
    const fields = resources[name].search;
    const select: Record<string, boolean> = { id: true };
    for (const f of fields) select[f] = true;
    const rows = await delegate(name).findMany({
      where,
      select,
      take: 8,
      orderBy: { createdAt: "desc" },
    });
    if (rows.length)
      groups.push({
        entity: key,
        results: rows.map((r) => ({
          id: String(r.id),
          label: label(r),
          href: `/${key}?record=${r.id}`,
        })),
      });
  }
  if (canResource(user, "users")) {
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true },
      take: 8,
    });
    if (users.length)
      groups.push({
        entity: "employees",
        results: users.map((u) => ({
          id: u.id,
          label: u.name,
          href: `/users?record=${u.id}`,
        })),
      });
  }
  return groups;
}
