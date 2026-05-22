import { useRole } from "@/hooks/useRole";
import SuperAdminDashboard from "./SuperAdminDashboard";
export default function Dashboard() {
  const { isSuperAdmin, isBngrc, isClient } = useRole();

  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }


  return (
    <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
      Accès non autorisé ou rôle inconnu.
    </div>
  );
}