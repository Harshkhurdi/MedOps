import { notFound } from "next/navigation";
import Workspace from "@/components/workspace";
import { configs } from "@/lib/ui-config";
import { authorize, can } from "@/lib/auth";
export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!configs[module]) notFound();
  let user;
  try {
    user = await authorize(module);
  } catch {
    return (
      <p>You do not have access to this module. Contact your administrator.</p>
    );
  }
  return (
    <Workspace
      module={module}
      config={configs[module]}
      writable={can(user, module, true)}
    />
  );
}
