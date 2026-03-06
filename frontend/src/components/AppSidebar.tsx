import {
  LayoutDashboard, AlertTriangle, Radio, Volume2,
  Bell, Users, Building2, MapPin, LogOut, ChevronLeft,ShieldCheck ,Lock 
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import "../styles/app-layout.css";

const mainItems = [
  { title: "Dashboard",          url: "/",                icon: LayoutDashboard },
  { title: "Envoyer une alerte", url: "/alertes/envoyer", icon: AlertTriangle },
  { title: "Sirènes",            url: "/sirenes",         icon: Radio },
  { title: "Audios",             url: "/audios",          icon: Volume2 },
  { title: "Notifications",      url: "/notifications",   icon: Bell },
  { title: "Géographie",         url: "/geographie",      icon: MapPin },
];

const adminItems = [
  { title: "Utilisateurs", url: "/utilisateurs", icon: Users },
  { title: "Clients",      url: "/clients",      icon: Building2 },
  { title: "Roles",      url: "/roles",      icon: ShieldCheck  },
  { title: "Permissions",      url: "/permissions",      icon: Lock   },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { user, logout, isSuperAdmin } = useAuth();

  const initials = ([user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className={`app-sidebar${collapsed ? " collapsed" : ""}`}>

      <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        <ChevronLeft size={12} />
      </button>

      <div className="sidebar-header">
        <img
          className="sidebar-logo-full"
          src="/src/assets/logo.jpg"
          alt="MITAO Forecast-Africa"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="sidebar-logo-icon">M</div>
      </div>

      <div className="sidebar-content">
        {/* Navigation principale — visible par tous */}
        <div className="nav-section-label">Navigation</div>
        {mainItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className="nav-item"
            activeClassName="active"
          >
            <span className="nav-item-icon"><item.icon size={16} /></span>
            <span className="nav-item-label">{item.title}</span>
            <span className="nav-item-tooltip">{item.title}</span>
          </NavLink>
        ))}

        {/* Administration — visible uniquement par les super admins */}
        {isSuperAdmin && (
          <>
            <div className="sidebar-divider" />
            <div className="nav-section-label">Administration</div>
            {adminItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className="nav-item"
                activeClassName="active"
              >
                <span className="nav-item-icon"><item.icon size={16} /></span>
                <span className="nav-item-label">{item.title}</span>
                <span className="nav-item-tooltip">{item.title}</span>
              </NavLink>
            ))}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">
              {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email}
            </div>
            <div className="user-role">{user?.role?.name || "Utilisateur"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
