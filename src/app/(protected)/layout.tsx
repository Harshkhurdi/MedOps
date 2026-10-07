import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import Shell from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <Shell
      user={{
        name: user.name,
        role: user.role,
        permissions: user.permissions.map((p) => ({
          module: p.module,
          read: p.read,
          write: p.write,
        })),
      }}
    >
      {children}
    </Shell>
  );
}
