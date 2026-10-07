import { authorizeResource } from "@/lib/record-access";
import Management from "@/components/management";
export default async function Page() {
  await authorizeResource("analytics");
  return <Management view="analytics" />;
}
