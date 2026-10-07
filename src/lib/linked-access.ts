import type { Actor } from "./auth";
import { canResource } from "./record-access";
import { AppError } from "./errors";
export function assertLinkedAccess(
  name: string,
  user: Actor,
  row: Record<string, unknown>,
) {
  if (
    ["approvals", "mail"].includes(name) &&
    !canResource(user, String(row.relatedModule))
  )
    throw new AppError(403, "Related record access is required");
}
