import {
  LayoutDashboard, AlertTriangle, Radio,
  Bell, Users, Building2, MapPin, LogOut, ChevronLeft,
  ShieldCheck, Lock, Tag, FolderOpen, Layers, Music, LayoutList, Send,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import "../styles/app-layout.css";
import logoImg from "@/assets/logo_white.png";

// Chaque item peut avoir une permission requise (optionnelle)
// Si pas de permission → visible par tous les connectés
interface NavItem {
  title:      string;
  url:        string;
  icon:       any;
  permission?: string;  // masqué si l'user n'a pas cette permission
}

const mainItems: NavItem[] = [
  { title: "Dashboard",          url: "/",                icon: LayoutDashboard },
  { title: "Envoyer une alerte", url: "/alertes/envoyer", icon: AlertTriangle,  permission: "send-alerte:execute" },
  { title: "Sirènes",            url: "/sirenes",         icon: Radio,          permission: "sirenes:read" },
];

const dataItems: NavItem[] = [
  { title: "Provinces", url: "/provinces", icon: MapPin, permission: "provinces:read" },
  { title: "Régions",   url: "/regions",   icon: MapPin, permission: "regions:read"   },
  { title: "Districts", url: "/districts", icon: MapPin, permission: "districts:read" },
  { title: "Villages",  url: "/villages",  icon: MapPin, permission: "villages:read"  },
];

const alertItems: NavItem[] = [
  { title: "Alertes",                 url: "/alertes",                icon: AlertTriangle, permission: "alertes:read"                 },
  { title: "Types d'alerte",          url: "/alerte-types",           icon: Tag,           permission: "alerte-types:read"            },
  { title: "Catégories",              url: "/categorie-alertes",      icon: FolderOpen,    permission: "categorie-alertes:read"       },
  { title: "Sous-catégories",         url: "/sous-categorie-alertes", icon: Layers,        permission: "sous-categorie-alertes:read"  },
  { title: "Audios alerte",           url: "/alerte-audios",          icon: Music,         permission: "alerte-audios:read"           },
  { title: "Notifications",           url: "/notifications",          icon: LayoutList,    permission: "notifications:read"           },
];

const adminItems: NavItem[] = [
  { title: "Utilisateurs", url: "/utilisateurs", icon: Users,       permission: "users:read"        },
  { title: "Clients",      url: "/clients",      icon: Building2,   permission: "customers:read"    },
  { title: "Rôles",        url: "/roles",        icon: ShieldCheck, permission: "roles:read"        },
  { title: "Permissions",  url: "/permissions",  icon: Lock,        permission: "permissions:read"  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle:  () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { user, logout, isSuperAdmin, can } = useAuth();

  // Filtrer les items selon les permissions
  const visible = (items: NavItem[]) =>
    items.filter(item => !item.permission || can(item.permission));

  const initials = ([user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const visibleMain  = visible(mainItems);
  const visibleData  = visible(dataItems);
  const visibleAlert = visible(alertItems);
  const visibleAdmin = visible(adminItems);

  return (
    <aside className={`app-sidebar${collapsed ? " collapsed" : ""}`}>

      <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        <ChevronLeft size={12} />
      </button>

      <div className="sidebar-header">
        <img
          className="sidebar-logo-full"
          src={logoImg}
          alt="MITAO Forecast-Africa"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="sidebar-logo-icon">M</div>
      </div>

      <div className="sidebar-content">

        {/* Navigation principale */}
        {visibleMain.length > 0 && (
          <>
            <div className="nav-section-label">Navigation</div>
            {visibleMain.map((item) => (
              <NavLink key={item.url} to={item.url} end={item.url === "/"} className="nav-item" activeClassName="active">
                <span className="nav-item-icon"><item.icon size={16} /></span>
                <span className="nav-item-label">{item.title}</span>
                <span className="nav-item-tooltip">{item.title}</span>
              </NavLink>
            ))}
          </>
        )}

        {/* Données géographiques */}
        {visibleData.length > 0 && (
          <>
            <div className="nav-section-label">Géographie</div>
            {visibleData.map((item) => (
              <NavLink key={item.url} to={item.url} end={false} className="nav-item" activeClassName="active">
                <span className="nav-item-icon"><item.icon size={16} /></span>
                <span className="nav-item-label">{item.title}</span>
                <span className="nav-item-tooltip">{item.title}</span>
              </NavLink>
            ))}
          </>
        )}

        {/* Alertes */}
        {visibleAlert.length > 0 && (
          <>
            <div className="nav-section-label">Alertes</div>
            {visibleAlert.map((item) => (
              <NavLink key={item.url} to={item.url} end={false} className="nav-item" activeClassName="active">
                <span className="nav-item-icon"><item.icon size={16} /></span>
                <span className="nav-item-label">{item.title}</span>
                <span className="nav-item-tooltip">{item.title}</span>
              </NavLink>
            ))}
          </>
        )}

        {/* Administration — superadmin OU permissions admin */}
        {(isSuperAdmin || visibleAdmin.length > 0) && (
          <>
            <div className="sidebar-divider" />
            <div className="nav-section-label">Administration</div>
            {(isSuperAdmin ? adminItems : visibleAdmin).map((item) => (
              <NavLink key={item.url} to={item.url} className="nav-item" activeClassName="active">
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