import { authorizeResource } from "@/lib/record-access";
import ServiceHome from "@/components/service-home";
export default async function Page() {
  await authorizeResource("service-sla");
  return <ServiceHome sla />;
}
