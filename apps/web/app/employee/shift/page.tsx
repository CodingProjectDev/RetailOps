import { PortalShell } from "@/components/portal-shell";
import { EmployeeShift } from "@/components/employee-shift";

export default function EmployeeShiftPage() {
  return (
    <PortalShell
      role="employee"
      title="My Shift"
      subtitle="Open your register, track sales and reconcile the cash drawer."
    >
      <EmployeeShift />
    </PortalShell>
  );
}
