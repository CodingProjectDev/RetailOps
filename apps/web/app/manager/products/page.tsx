import { PortalShell } from "@/components/portal-shell";
import { ProductManager } from "@/components/product-manager";

export default function ProductsPage() {
  return (
    <PortalShell
      role="manager"
      title="Products"
      subtitle="Create products, update pricing and adjust stock with a permanent audit trail."
    >
      <ProductManager />
    </PortalShell>
  );
}
