import { ManagerShifts } from "@/components/manager-shifts";
import { PortalShell } from "@/components/portal-shell";

export default function ManagerShiftsPage() {
  return (
    <PortalShell
      role="manager"
      title="Employee Shifts"
      subtitle="Track open registers, sales activity and cash drawer shortages or overages."
    >
      <ManagerShifts />
    </PortalShell>
  );
}
