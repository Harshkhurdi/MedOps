import { MODULES, can } from "@/lib/auth";
import { notFound } from "next/navigation";
import Workspace from "@/components/workspace";
import { configs } from "@/lib/ui-config";
import { authorizeResource, canResource } from "@/lib/record-access";
export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!configs[module]) notFound();
  let user;
  try {
    user = await authorizeResource(module);
  } catch {
    return (
      <p>You do not have access to this module. Contact your administrator.</p>
    );
  }
  return (
    <Workspace
      module={module}
      config={configs[module]}
      writable={canResource(user, module, true)}
      canExport={can(user, "exports", true)}
      allowedModules={MODULES.filter((m) => canResource(user, m)).map((m) =>
        m === "generated"
          ? "generator"
          : m === "comparisons"
            ? "comparison"
            : m,
      )}
    />
  );
}
