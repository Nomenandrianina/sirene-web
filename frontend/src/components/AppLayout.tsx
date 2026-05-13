import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/notificationsweb/NotificationBell";

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

export function AppLayout({ children, noPadding }: { children: React.ReactNode; noPadding?: boolean }) {
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
    <div className="flex h-screen overflow-hidden bg-[#f4f6f9] font-sans">
      {/* ← remplace app-shell */}
      
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
  
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[49]" />
      )}
  
      {/* app-main */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        
        {/* header */}
        <header className="h-14 bg-white border-b border-[#e8eaed] flex items-center justify-between px-6 sticky top-0 z-40 gap-4 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#9aa0a6]">
              Plateforme d'alertes &nbsp;/&nbsp; <strong className="text-[#1a1f2e] font-semibold">{pageLabel}</strong>
            </div>
          </div>
  
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-2.5 py-1 text-[11px] text-[#16a34a] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              Système actif
            </div>
  
            <NotificationBell />
  
            {/* User dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(v => !v)}
                className={`flex items-center gap-2 px-2 pr-2.5 py-1 rounded-xl border transition
                  ${dropOpen ? "bg-[#f4f6f9] border-[#d1d5db]" : "bg-white border-[#e8eaed] hover:bg-[#f4f6f9]"}`}
              >
                <div className="w-7 h-7 rounded-lg bg-[#1a35a0] text-white flex items-center justify-center text-[11px] font-bold">
                  {initials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-semibold text-[#1a1f2e] max-w-[120px] truncate leading-tight">{fullName}</span>
                  <span className="text-[10px] text-[#9aa0a6]">{user?.role?.name || "Utilisateur"}</span>
                </div>
                <ChevronDown size={13} className={`text-[#9aa0a6] transition-transform ${dropOpen ? "rotate-180" : ""}`} />
              </button>
  
              {dropOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-56 bg-white border border-[#e8eaed] rounded-xl shadow-xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1a35a0] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#1a1f2e] truncate">{fullName}</div>
                      <div className="text-[11px] text-[#9aa0a6] truncate">{user?.email}</div>
                    </div>
                  </div>
                  <div className="h-px bg-[#f1f3f5]" />
                  <button
                    onClick={() => { setDropOpen(false); navigate("/profile"); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#5f6368] hover:bg-[#f4f6f9] hover:text-[#1a1f2e] transition"
                  >
                    <User size={14} /> Mon profil
                  </button>
                  <div className="h-px bg-[#f1f3f5]" />
                  <button
                    onClick={() => { setDropOpen(false); logout(); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#5f6368] hover:bg-[#fef2f2] hover:text-[#dc2626] transition"
                  >
                    <LogOut size={14} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
  
        {/* ← SEUL scroll de la page */}
        <main className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[#f4f6f9] ${noPadding ? "" : "p-7"}`}>
          {children}
        </main>
  
      </div>
    </div>
  );
}