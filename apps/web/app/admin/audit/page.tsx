
import {
  PlatformAdminShell
} from "@/components/platform-admin-shell";
import {
  PlatformAuditLog
} from "@/components/platform-audit-log";

export default function PlatformAuditPage() {
  return (
    <PlatformAdminShell
      title="Audit Log"
      subtitle="Track platform-level access-control actions."
    >
      <PlatformAuditLog />
    </PlatformAdminShell>
  );
}
