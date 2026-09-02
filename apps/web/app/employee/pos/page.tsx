import { PortalShell } from "@/components/portal-shell";
import { PosTerminal } from "@/components/pos-terminal";

export default function PosPage() {
  return (
    <PortalShell
      role="employee"
      title="POS Terminal"
      subtitle="USB barcode scanners usually behave like keyboards: barcode + Enter."
    >
      <PosTerminal />
    </PortalShell>
  );
}
