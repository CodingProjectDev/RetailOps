import { LowStockAlerts } from "@/components/low-stock-alerts";
import { PortalShell } from "@/components/portal-shell";

export default function AlertsPage() {
  return (
    <PortalShell
      role="manager"
      title="Inventory Alerts"
      subtitle="Review low stock, critical inventory and suggested reorder quantities."
    >
      <LowStockAlerts />
    </PortalShell>
  );
}
