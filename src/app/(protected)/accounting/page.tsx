import { authorize } from "@/lib/auth";
import Accounting from "@/components/accounting";
export default async function Page() {
  await authorize("accounting");
  return <Accounting />;
}
