import { ManagerDashboard } from "@/components/manager-dashboard";
import { PortalShell } from "@/components/portal-shell";

export default function ManagerDashboardPage() {
  return (
    <PortalShell
      role="manager"
      title="Dashboard"
      subtitle="Live sales, payments and inventory performance."
    >
      <ManagerDashboard />
    </PortalShell>
  );
}
