import { useRole } from "@/hooks/useRole";
import DashboardSuperAdmin from "./DashboardSuperAdmin";
import DashboardBngrc      from "./DashboardBngrc";
import DashboardCustomer   from "./DashboardCustomer";

/**
 * DashboardRouter
 *
 * Point d'entrée unique de la route "/dashboard".
 * Monte le composant adapté au rôle de l'utilisateur connecté.
 *
 * Rôles reconnus :
 *   SUPER_ADMIN        → DashboardSuperAdmin (alertes BNGRC + diffusions clients)
 *   BNGRC_ALERTE       → DashboardBngrc     (alertes seulement)
 *   CUSTOMER_ADMIN     → DashboardCustomer  (diffusions du client lié)
 *   CUSTOMER_OPERATOR  → DashboardCustomer  (idem, lecture seule côté UI si besoin)
 */
export default function Dashboard() {
  const { isSuperAdmin, isBngrc, isClient } = useRole();

  if (isSuperAdmin) return <DashboardSuperAdmin />;
  if (isBngrc)      return <DashboardBngrc />;
  if (isClient)     return <DashboardCustomer />;

  // Sécurité : ne devrait jamais arriver si les guards de route sont en place
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", flexDirection: "column", gap: 12,
      color: "#94a3b8", fontFamily: "sans-serif",
    }}>
      <span style={{ fontSize: 32 }}>🔒</span>
      <p style={{ fontSize: 14, margin: 0 }}>Rôle non reconnu — accès refusé.</p>
    </div>
  );
}