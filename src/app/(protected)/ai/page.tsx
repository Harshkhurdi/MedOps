import { authorize, can } from "@/lib/auth";
import AiAssistant from "@/components/ai-assistant";
export default async function AiPage() {
  let user;
  try {
    user = await authorize("ai");
  } catch {
    return <p>AI permission is required. Contact your administrator.</p>;
  }
  return <AiAssistant writable={can(user, "ai", true)} />;
}
