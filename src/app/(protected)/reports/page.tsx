import { authorize } from "@/lib/auth";
import Reports from "@/components/reports";
export default async function ReportsPage() {
  try {
    await authorize("reports");
    await authorize("invoices");
  } catch {
    return (
      <p>
        Reports and invoice permissions are required. Contact your
        administrator.
      </p>
    );
  }
  return <Reports />;
}
