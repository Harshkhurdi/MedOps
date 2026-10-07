import { authorize } from "@/lib/auth";
import { canResource } from "@/lib/record-access";
import Reports from "@/components/reports";
import ReportRegisters from "@/components/report-registers";
const registers = [
  ["tenders", "Tender pipeline"],
  ["decisions", "Tender decisions"],
  ["results", "Wins / losses"],
  ["rfqs", "RFQ status"],
  ["quotes", "Manufacturer quotes"],
  ["comparisons", "Commercial comparisons"],
  ["securities", "EMD / PBG"],
  ["orders", "Purchase orders"],
  ["deliveries", "Deliveries"],
  ["equipment", "Installed equipment"],
  ["warranties", "Warranty expiry"],
  ["amc-opportunities", "AMC opportunities"],
  ["consumable-opportunities", "Consumable opportunities"],
  ["tickets", "Service tickets"],
  ["service-sla", "Service SLA"],
  ["parts", "Spare parts"],
  ["costs", "Recorded costs"],
  ["profitability", "Operational profitability"],
  ["analytics", "Manufacturer / product / customer performance"],
  ["tasks", "Employee tasks"],
];
export default async function ReportsPage() {
  const u = await authorize("reports");
  return (
    <>
      <ReportRegisters
        links={registers
          .filter(([m]) => canResource(u, m))
          .map(([m, label]) => ({ href: "/" + m, label }))}
      />
      {canResource(u, "invoices") ? (
        <Reports />
      ) : (
        <p>Invoice permission is required to view receivables.</p>
      )}
    </>
  );
}
