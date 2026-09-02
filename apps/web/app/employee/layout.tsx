import { AuthGate } from "@/components/auth-gate";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate allowedRoles={["CASHIER"]}>{children}</AuthGate>;
}
