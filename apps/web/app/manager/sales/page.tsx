import { PortalShell } from "@/components/portal-shell";
import { SalesHistory } from "@/components/sales-history";

export default function SalesPage() {
  return (
    <PortalShell
      role="manager"
      title="Sales History"
      subtitle="Search real transactions by receipt, product, barcode, cashier, date, payment, status, and total."
    >
      <SalesHistory />
    </PortalShell>
  );
}
