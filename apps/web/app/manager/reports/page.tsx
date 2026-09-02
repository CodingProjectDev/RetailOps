import { PortalShell } from "@/components/portal-shell";
import { ReportsDashboard } from "@/components/reports-dashboard";

export default function ReportsPage() {
  return (
    <PortalShell
      role="manager"
      title="Reports"
      subtitle="Analyze sales, refunds, payments and product performance by date range."
    >
      <ReportsDashboard />
    </PortalShell>
  );
}
