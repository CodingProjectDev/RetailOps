import { PortalShell } from "@/components/portal-shell";
import { PurchaseOrdersManager } from "@/components/purchase-orders-manager";

export default function PurchaseOrdersPage() {
  return (
    <PortalShell
      role="manager"
      title="Purchase Orders"
      subtitle="Order products from suppliers and receive delivered inventory into stock."
    >
      <PurchaseOrdersManager />
    </PortalShell>
  );
}
