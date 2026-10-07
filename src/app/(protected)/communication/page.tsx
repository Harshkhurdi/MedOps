import { authorize } from "@/lib/auth";
import Communication from "@/components/communication";
export default async function Page() {
  await authorize("communication");
  return <Communication />;
}
