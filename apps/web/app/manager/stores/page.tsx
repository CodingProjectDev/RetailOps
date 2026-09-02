import { PortalShell } from "@/components/portal-shell";
import { StoresManager } from "@/components/stores-manager";

export default function StoresPage() {
  return (
    <PortalShell
      role="manager"
      title="Stores"
      subtitle="Manage business locations and assign managers and employees."
    >
      <StoresManager />
    </PortalShell>
  );
}
