import { PortalShell } from "@/components/portal-shell";
import { ReceiptPrinterSettings } from "@/components/receipt-printer-settings";

export default function PrinterSetupPage() {
  return (
    <PortalShell
      role="employee"
      title="Printer Setup"
      subtitle="Configure thermal receipt printing for this register."
    >
      <ReceiptPrinterSettings />
    </PortalShell>
  );
}
