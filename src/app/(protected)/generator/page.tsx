import Generator from "@/components/generator";
import { authorize } from "@/lib/auth";
export default async function GeneratorPage() {
  try {
    await authorize("generated", true);
  } catch {
    return <p>Document generation permission is required.</p>;
  }
  return <Generator />;
}
