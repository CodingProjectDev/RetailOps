import { InventoryManager } from "@/components/inventory-manager";
import { PortalShell } from "@/components/portal-shell";

export default function InventoryPage() {
  return (
    <PortalShell
      role="manager"
      title="Inventory"
      subtitle="Store-specific stock, values and low-stock status."
    >
      <InventoryManager />
    </PortalShell>
  );
}
