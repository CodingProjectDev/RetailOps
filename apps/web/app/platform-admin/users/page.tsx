
import {
  Suspense
} from "react";
import {
  PlatformAdminShell
} from "@/components/platform-admin-shell";
import {
  PlatformUsers
} from "@/components/platform-users";

export default function PlatformUsersPage() {
  return (
    <PlatformAdminShell
      title="Tenant Users"
      subtitle="Owners, managers, cashiers and inventory clerks across RetailOps."
    >
      <Suspense
        fallback={
          <section className="platform-admin-panel">
            Loading tenant users…
          </section>
        }
      >
        <PlatformUsers />
      </Suspense>
    </PlatformAdminShell>
  );
}
