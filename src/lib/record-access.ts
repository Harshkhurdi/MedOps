import { authorize, can, type Actor } from "./auth";
import { AppError } from "./errors";
export const pricingModules = [
  "quotes",
  "comparisons",
  "results",
  "costs",
  "profitability",
  "analytics",
];
export function canResource(user: Actor, name: string, write = false) {
  if (
    ["approval-policies", "sla-rules", "compatibility"].includes(name) &&
    user.role !== "ADMIN"
  )
    return false;
  return (
    can(user, name, write) &&
    (!pricingModules.includes(name) || can(user, "pricing", write))
  );
}
export async function authorizeResource(name: string, write = false) {
  const user = await authorize(name, write);
  if (!canResource(user, name, write))
    throw new AppError(
      403,
      "Required module and action permissions are missing",
    );
  return user;
}
