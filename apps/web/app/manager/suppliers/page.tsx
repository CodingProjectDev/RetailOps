import { PortalShell } from "@/components/portal-shell";
import { SuppliersManager } from "@/components/suppliers-manager";

export default function SuppliersPage() {
  return (
    <PortalShell
      role="manager"
      title="Suppliers"
      subtitle="Manage the vendors that supply products to your store."
    >
      <SuppliersManager />
    </PortalShell>
  );
}
