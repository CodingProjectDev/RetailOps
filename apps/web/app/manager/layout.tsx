import { AuthGate } from "@/components/auth-gate";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate allowedRoles={["OWNER", "MANAGER"]}>{children}</AuthGate>;
}
