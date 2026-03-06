import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import "@/styles/app-layout.css";

const routeLabels: Record<string, string> = {
  "/":                "Dashboard",
  "/alertes/envoyer": "Envoyer une alerte",
  "/sirenes":         "Sirènes",
  "/audios":          "Audios",
  "/notifications":   "Notifications",
  "/geographie":      "Géographie",
  "/utilisateurs":    "Utilisateurs",
  "/clients":         "Clients",
  "/roles":           "Rôles",
  "/permissions":     "Permissions",
  "/profile":         "Mon profil",
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const pageLabel = routeLabels[location.pathname] ?? "Sirène Web";

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean).join("").toUpperCase()
    || user?.email?.[0]?.toUpperCase() || "?";

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ")
    || user?.email || "Utilisateur";

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="app-shell">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 49, backdropFilter: "blur(2px)",
        }} />
      )}

      <div className="app-main">
        <header className="app-header">
          <div className="header-left">
            <button className="header-icon-btn" onClick={() => setMobileOpen(v => !v)}
              aria-label="Menu" style={{ display: "none" }}>
              <Menu size={16} />
            </button>
            <div className="header-breadcrumb">
              Plateforme d'alertes &nbsp;/&nbsp; <strong>{pageLabel}</strong>
            </div>
          </div>

          <div className="header-right">
            <div className="status-chip">
              <span className="status-chip-dot" />
              Système actif
            </div>

            <button className="header-icon-btn" aria-label="Notifications">
              <Bell size={15} />
              <span className="notif-badge" />
            </button>

            {/* ── User dropdown ── */}
            <div className="header-user-wrap" ref={dropRef}>
              <button
                className={`header-user${dropOpen ? " open" : ""}`}
                onClick={() => setDropOpen(v => !v)}
              >
                <div className="header-user-avatar">{initials}</div>
                <div className="header-user-text">
                  <span className="h-name">{fullName}</span>
                  <span className="h-role">{user?.role?.name || "Utilisateur"}</span>
                </div>
                <ChevronDown size={13} className={`header-chevron${dropOpen ? " rotated" : ""}`} />
              </button>

              {dropOpen && (
                <div className="user-dropdown">
                  {/* Infos user */}
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">{initials}</div>
                    <div>
                      <div className="dropdown-name">{fullName}</div>
                      <div className="dropdown-email">{user?.email}</div>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <button className="dropdown-item" onClick={() => {
                    setDropOpen(false);
                    navigate("/profile");
                  }}>
                    <User size={14} />
                    Mon profil
                  </button>

                  <div className="dropdown-divider" />

                  <button className="dropdown-item danger" onClick={() => {
                    setDropOpen(false);
                    logout();
                  }}>
                    <LogOut size={14} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}