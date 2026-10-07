import { authorize, can, type Actor } from "./auth";
import { AppError } from "./errors";
export const pricingModules = ["quotes", "comparisons", "results"];
export function canResource(user: Actor, name: string, write = false) {
  return (
    can(user, name, write) &&
    (!pricingModules.includes(name) || can(user, "pricing", write))
  );
}
export async function authorizeResource(name: string, write = false) {
  const user = await authorize(name, write);
  if (!canResource(user, name, write))
    throw new AppError(403, "Pricing permission is required");
  return user;
}
