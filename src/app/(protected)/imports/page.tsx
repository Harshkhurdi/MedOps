import { authorize } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import Imports from "@/components/imports";
export default async function Page() {
  const u = await authorize("imports");
  if (u.role !== "ADMIN")
    throw new AppError(403, "Administrator access required");
  return <Imports />;
}
