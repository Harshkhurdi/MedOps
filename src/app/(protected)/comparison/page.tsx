import Comparison from "@/components/comparison";
import { authorizeResource } from "@/lib/record-access";
export default async function Page() {
  try {
    await authorizeResource("comparisons");
  } catch {
    return <p>Commercial comparison and pricing permission required.</p>;
  }
  return <Comparison />;
}
