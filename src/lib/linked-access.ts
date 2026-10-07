import type { Actor } from "./auth";
import { canResource } from "./record-access";
import { AppError } from "./errors";
export function assertLinkedAccess(
  name: string,
  user: Actor,
  row: Record<string, unknown>,
) {
  if (
    ["approvals", "mail", "interactions"].includes(name) &&
    row.relatedModule &&
    !canResource(user, String(row.relatedModule))
  )
    throw new AppError(403, "Related record access is required");
}
