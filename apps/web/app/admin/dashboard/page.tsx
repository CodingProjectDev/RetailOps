
import {
  PlatformAdminDashboard
} from "@/components/platform-admin-dashboard";
import {
  PlatformAdminShell
} from "@/components/platform-admin-shell";

export default function PlatformAdminDashboardPage() {
  return (
    <PlatformAdminShell
      title="Platform Dashboard"
      subtitle="Manage RetailOps businesses and tenant account access."
    >
      <PlatformAdminDashboard />
    </PlatformAdminShell>
  );
}
