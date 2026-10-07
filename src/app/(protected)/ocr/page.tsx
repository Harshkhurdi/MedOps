import { authorize } from "@/lib/auth";
import Ocr from "@/components/ocr";
export default async function Page() {
  await authorize("ocr");
  return <Ocr />;
}
