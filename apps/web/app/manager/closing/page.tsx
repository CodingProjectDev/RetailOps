import { DailyClosing } from "@/components/daily-closing";
import { PortalShell } from "@/components/portal-shell";

export default function DailyClosingPage() {
  return (
    <PortalShell
      role="manager"
      title="Daily Closing"
      subtitle="End-of-day sales, payments and cash drawer reconciliation."
    >
      <DailyClosing />
    </PortalShell>
  );
}
