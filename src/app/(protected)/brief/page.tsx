import { authorizeResource } from "@/lib/record-access";
import Brief from "@/components/brief";
export default async function Page() {
  await authorizeResource("brief");
  return <Brief />;
}
