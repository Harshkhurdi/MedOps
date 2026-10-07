import Settings from "@/components/settings";
import { authorize } from "@/lib/auth";
export default async function SettingsPage() {
  try {
    await authorize("settings");
  } catch {
    return <p>Administrator permission is required.</p>;
  }
  return <Settings />;
}
