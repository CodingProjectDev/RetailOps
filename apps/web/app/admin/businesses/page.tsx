
import {
  PlatformBusinesses
} from "@/components/platform-businesses";
import {
  PlatformAdminShell
} from "@/components/platform-admin-shell";

export default function PlatformBusinessesPage() {
  return (
    <PlatformAdminShell
      title="Businesses"
      subtitle="Review tenant registrations and control business access."
    >
      <PlatformBusinesses />
    </PlatformAdminShell>
  );
}
