import { BusinessSettings } from "@/components/business-settings";
import { PortalShell } from "@/components/portal-shell";

export default function BusinessPage() {
  return (
    <PortalShell
      role="manager"
      title="Business"
      subtitle="Manage the RetailOps tenant attached to your account."
    >
      <BusinessSettings />
    </PortalShell>
  );
}
