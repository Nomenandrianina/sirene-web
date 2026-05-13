import { useMemo } from "react";
import { Radio, AlertTriangle, CheckCircle, TrendingUp, Clock, XCircle, MapPin, Activity, Building2, ShieldAlert, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { sirenesApi }       from "@/services/sirene.api";
import { notificationsApi } from "@/services/notification.api";
import { provincesApi }     from "@/services/province.api";
import { regionsApi }       from "@/services/region.api";
import { AppLayout }        from "@/components/AppLayout";
import { useGreeting }        from "@/hooks/useGreeting";
import { customersApi }     from "@/services/customers.api";
import { useRole } from "@/hooks/useRole";

import "../styles/page.css";

// ─── helpers ──────────────────────────────────────────────────────────────────

const toArr = (r: any) => Array.isArray(r) ? r : r?.response ?? r?.data ?? [];

function fmtDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "< 1h";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

// ─── Tooltip chart barres ─────────────────────────────────────────────────────

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
        {payload[0].value}
        <span style={{ fontSize: 12, fontWeight: 400, color: "#64748b", marginLeft: 4 }}>alertes</span>
      </div>
    </div>
  );
};

// ─── Tooltip donut ────────────────────────────────────────────────────────────

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 10, padding: "8px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{payload[0].name}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{payload[0].value}</div>
    </div>
  );
};

// ─── composant StatCard ───────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: React.ReactNode; sub: string;
  icon: any; color: "green" | "amber" | "blue" | "purple" | "red";
}) {
  const palette: Record<string, { bg: string; icon: string; text: string }> = {
    green:  { bg: "#f0fdf4", icon: "#22c55e", text: "#15803d" },
    amber:  { bg: "#fffbeb", icon: "#f59e0b", text: "#b45309" },
    blue:   { bg: "#eff6ff", icon: "#3b82f6", text: "#1d4ed8" },
    purple: { bg: "#f5f3ff", icon: "#8b5cf6", text: "#6d28d9" },
    red:    { bg: "#fef2f2", icon: "#ef4444", text: "#b91c1c" },
  };
  const p = palette[color];
  return (
    <div className="stat-card" style={{ background: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>{title}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={p.icon} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isSuperAdmin, isBngrc, isClient, customerId } = useRole();
  // const { role, customerId } = useAuth();
  const isAdmin = isSuperAdmin ;

  // ── Données (l'API filtre déjà selon le JWT) ───────────────────────────────
  const { data: rawSirenes }   = useQuery({ queryKey: ["sirenes"],           queryFn: () => sirenesApi.getAll() });
  const { data: rawNotifs }    = useQuery({ queryKey: ["notifications-all"], queryFn: () => notificationsApi.getAll({ limit: 500 }) });
  const { data: rawStats }     = useQuery({ queryKey: ["notif-stats"],       queryFn: () => notificationsApi.getStats() });
  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"],         queryFn: () => provincesApi.getAll() });
  const { data: rawRegions }   = useQuery({ queryKey: ["regions"],           queryFn: () => regionsApi.getAll() });

  // Superadmin seulement
  const { data: rawCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn:  () => customersApi.getAll(),
    enabled:  isAdmin,
  });

  const toArr = (r: any) => Array.isArray(r) ? r : r?.response ?? r?.data ?? [];

  const sirenes   = useMemo(() => toArr(rawSirenes),   [rawSirenes]);
  const notifs    = useMemo(() => toArr(rawNotifs),    [rawNotifs]);
  const provinces = useMemo(() => toArr(rawProvinces), [rawProvinces]);
  const regions   = useMemo(() => toArr(rawRegions),   [rawRegions]);
  const customers = useMemo(() => toArr(rawCustomers), [rawCustomers]);
  const stats     = rawStats as any;

  const { greeting, firstName, period } = useGreeting();

  // ── Calculs communs ────────────────────────────────────────────────────────
  const totalSirenes    = sirenes.length;
  const activeSirenes   = sirenes.filter((s: any) => s.isActive).length;
  const inactiveSirenes = totalSirenes - activeSirenes;
  const offlineSirenes  = sirenes.filter((s: any) => !s.isActive);

  const totalSent    = stats?.sent    ?? notifs.filter((n: any) => n.status === "sent").length;
  const totalFailed  = stats?.failed  ?? notifs.filter((n: any) => n.status === "failed").length;
  const totalPending = stats?.pending ?? notifs.filter((n: any) => n.status === "pending").length;
  const totalNotifs  = stats?.total   ?? notifs.length;

  const successRate = totalNotifs > 0
    ? Math.round((totalSent / (totalSent + totalFailed || 1)) * 1000) / 10
    : 0;

  const todayStart  = new Date(); todayStart.setHours(0, 0, 0, 0);
  const monthStart  = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const lastMonthStart = new Date(monthStart); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  const alertesToday = notifs.filter((n: any) =>
    n.status === "sent" && new Date(n.sendingTime) >= todayStart
  ).length;

  const alertesMonth = notifs.filter((n: any) =>
    n.status === "sent" && new Date(n.sendingTime) >= monthStart
  ).length;

  const alertesLastMonth = notifs.filter((n: any) =>
    n.status === "sent" &&
    new Date(n.sendingTime) >= lastMonthStart &&
    new Date(n.sendingTime) < monthStart
  ).length;

  const monthDelta = alertesLastMonth > 0
    ? Math.round(((alertesMonth - alertesLastMonth) / alertesLastMonth) * 100)
    : null;

  // ── Graphique barres 14j ───────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      d.setHours(0, 0, 0, 0);
      return { date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), ts: d.getTime(), count: 0 };
    });
    notifs.forEach((n: any) => {
      if (n.status !== "sent" || !n.sendingTime) return;
      const t = new Date(n.sendingTime).setHours(0, 0, 0, 0);
      const day = days.find(d => d.ts === t);
      if (day) day.count++;
    });
    return days;
  }, [notifs]);

  // ── Donut statuts ──────────────────────────────────────────────────────────
  const donutData = [
    { name: "Envoyés",    value: totalSent,    color: "#22c55e" },
    { name: "Échoués",    value: totalFailed,  color: "#ef4444" },
    { name: "En attente", value: totalPending, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  // ── Alertes par catégorie ──────────────────────────────────────────────────
  const categorieData = useMemo(() => {
    const map = new Map<string, number>();
    notifs.forEach((n: any) => {
      if (n.status !== "sent") return;
      const cat = n.sousCategorie?.categorie?.name ?? n.sousCategorie?.name ?? "Autre";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [notifs]);

  // ── Activité par sirène (client) ───────────────────────────────────────────
  const sireneActivity = useMemo(() => {
    return sirenes.map((s: any) => {
      const count = notifs.filter((n: any) => n.status === "sent" && n.sireneId === s.id).length;
      return { ...s, alertCount: count };
    }).sort((a: any, b: any) => b.alertCount - a.alertCount).slice(0, 5);
  }, [sirenes, notifs]);

  // ── Couverture par province (admin) ───────────────────────────────────────
  const provinceStats = useMemo(() => {
    return provinces.map((p: any) => {
      const regionCount = regions.filter((r: any) =>
        Number(r.provinceId ?? r.province?.id) === p.id
      ).length;
      const sireneCount = sirenes.filter((s: any) =>
        Number(s.village?.fokontany?.commune?.district?.region?.provinceId) === p.id
      ).length;
      return { name: p.name, regions: regionCount, sirenes: sireneCount };
    }).sort((a: any, b: any) => b.sirenes - a.sirenes).slice(0, 6);
  }, [provinces, regions, sirenes]);

  const maxSirenesByProvince = Math.max(...provinceStats.map((p: any) => p.sirenes), 1);

  // ── Top clients par alertes (admin) ────────────────────────────────────────
  const topCustomers = useMemo(() => {
    return customers.map((c: any) => {
      const clientSireneIds = sirenes
        .filter((s: any) => s.customers?.some((sc: any) => sc.id === c.id))
        .map((s: any) => s.id);
      const alertCount = notifs.filter((n: any) =>
        n.status === "sent" && clientSireneIds.includes(n.sireneId)
      ).length;
      const thisMonth = notifs.filter((n: any) =>
        n.status === "sent" && clientSireneIds.includes(n.sireneId) &&
        new Date(n.sendingTime) >= monthStart
      ).length;
      const lastMonth = notifs.filter((n: any) =>
        n.status === "sent" && clientSireneIds.includes(n.sireneId) &&
        new Date(n.sendingTime) >= lastMonthStart &&
        new Date(n.sendingTime) < monthStart
      ).length;
      const delta = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
      return { ...c, alertCount: thisMonth, delta, sireneCount: clientSireneIds.length };
    }).sort((a: any, b: any) => b.alertCount - a.alertCount).slice(0, 5);
  }, [customers, sirenes, notifs]);

  // ── Dernières notifications ────────────────────────────────────────────────
  const lastNotifs = useMemo(() => {
    return [...notifs]
      .filter((n: any) => n.sendingTime || n.createdAt)
      .sort((a: any, b: any) =>
        new Date(b.sendingTime ?? b.createdAt).getTime() -
        new Date(a.sendingTime ?? a.createdAt).getTime()
      ).slice(0, 6);
  }, [notifs]);

  const relativeTime = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (h < 1) return "< 1h";
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}j`;
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    sent:    { label: "Envoyé",     color: "#15803d", bg: "#f0fdf4" },
    failed:  { label: "Échoué",     color: "#b91c1c", bg: "#fef2f2" },
    pending: { label: "En attente", color: "#b45309", bg: "#fffbeb" },
  };

  return (
    <AppLayout>
      <div className="page-wrap">

        {/* ── Header ── */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              {greeting}{firstName ? `, ${firstName}` : ""}
              <span style={{ marginLeft: 6 }}>
                {period === "matin" ? "☀️" : period === "journée" ? "🌤️" : period === "soir" ? "🌙" : "🌃"}
              </span>
            </h1>
            <p className="page-subtitle">
              {isAdmin
                ? "Vue globale de toutes les sirènes et clients"
                : "Tableau de bord de votre compte"}
            </p>
          </div>
        </div>

        {/* ── Stat cards (communes aux deux rôles) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 24 }}>
          <StatCard
            title="Sirènes actives"
            value={`${activeSirenes}/${totalSirenes}`}
            sub={inactiveSirenes > 0 ? `${inactiveSirenes} hors ligne` : "Toutes opérationnelles"}
            icon={Radio} color="green"
          />
          <StatCard
            title="Alertes aujourd'hui"
            value={alertesToday}
            sub={isAdmin ? "Toutes sirènes" : "Vos sirènes uniquement"}
            icon={AlertTriangle} color="amber"
          />
          {isAdmin ? (
            <StatCard
              title="Clients actifs"
              value={customers.filter((c: any) => c.isActive).length || customers.length}
              sub={`${totalSirenes} sirènes au total`}
              icon={Building2} color="blue"
            />
          ) : (
            <StatCard
              title="Alertes ce mois"
              value={alertesMonth}
              sub={monthDelta !== null
                ? `${monthDelta >= 0 ? "+" : ""}${monthDelta}% vs mois dernier`
                : "Mois en cours"}
              icon={TrendingUp} color="blue"
            />
          )}
          <StatCard
            title="Taux de succès"
            value={`${successRate}%`}
            sub={`${totalFailed} échec${totalFailed > 1 ? "s" : ""} total`}
            icon={CheckCircle}
            color={successRate >= 95 ? "green" : successRate >= 80 ? "amber" : "red"}
          />
        </div>

        {/* ── Nouvelles stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 24 }}>
          {isAdmin && (
            <StatCard
              title="Alertes ce mois"
              value={alertesMonth}
              sub={monthDelta !== null
                ? `${monthDelta >= 0 ? "+" : ""}${monthDelta}% vs mois dernier`
                : "Mois en cours"}
              icon={TrendingUp} color="blue"
            />
          )}
          <StatCard
            title="Bénéficiaires"
            value={stats?.totalSubscribers
              ? new Intl.NumberFormat("fr-FR").format(stats.totalSubscribers)
              : "—"}
            sub={isAdmin ? "Abonnés FCM total" : "Abonnés notifiés"}
            icon={Users} color="purple"
          />
          {/* <StatCard
            title={isAdmin ? "Provinces couvertes" : "Zones couvertes"}
            value={isAdmin
              ? `${provinces.length}/${provinces.length}`
              : regions.length}
            sub={isAdmin ? "Couverture nationale" : "Régions actives"}
            icon={MapPin} color="teal"
          /> */}
          {!isAdmin && categorieData[0] && (
            <StatCard
              title="Catégorie principale"
              value={categorieData[0].name}
              sub={`${Math.round((categorieData[0].value / alertesMonth) * 100)}% des alertes`}
              icon={AlertTriangle} color="amber"
            />
          )}
        </div>

        {/* ── Graphique + donut ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, marginBottom: 24 }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Alertes envoyées — 14 derniers jours</span>
            </div>
            <div className="panel-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)", radius: 6 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={i === chartData.length - 1 ? "#1a35a0" : "#dbeafe"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
            <div className="panel-header">
              <span className="panel-title">Répartition des statuts</span>
            </div>
            <div className="panel-body" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              {donutData.length > 0 ? (
                <>
                  <PieChart width={200} height={180}>
                    <Pie data={donutData} cx={100} cy={90} innerRadius={55} outerRadius={82}
                      dataKey="value" paddingAngle={3} stroke="none">
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                    {donutData.map(d => (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                          <span style={{ fontSize: 13, color: "#64748b" }}>{d.name}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune donnée</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Ligne 3 : contenu différencié par rôle ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, marginBottom: 24 }}>

          {/* Dernières notifications (commun) */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Dernières notifications</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {lastNotifs.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune notification</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid #f1f5f9" }}>
                      {["Sirène", "Catégorie", "Zone", "Statut", "Il y a"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lastNotifs.map((n: any) => {
                      const sc = statusConfig[n.status] ?? { label: n.status, color: "#64748b", bg: "#f8fafc" };
                      return (
                        <tr key={n.id} style={{ borderBottom: "0.5px solid #f8fafc" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#fafbff")}
                          onMouseLeave={e => (e.currentTarget.style.background = "")}>
                          <td style={{ padding: "11px 16px", fontWeight: 500, color: "#1e293b", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.sirene?.name ?? `Sirène #${n.sireneId}`}
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.sousCategorie?.categorie?.name ?? n.sousCategorie?.name ?? "—"}
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.sirene?.village?.name ?? "—"}
                          </td>
                          <td style={{ padding: "11px 16px" }}>
                            <span style={{ background: sc.bg, color: sc.color, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ padding: "11px 16px", color: "#94a3b8" }}>
                            {relativeTime(n.sendingTime ?? n.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Colonne droite : différenciée */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {isAdmin ? (
              /* Admin : couverture provinces */
              <div className="panel" style={{ flex: 1 }}>
                <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={14} color="#94a3b8" />
                  <span className="panel-title">Couverture géographique</span>
                </div>
                <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{provinces.length}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Provinces</div>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{regions.length}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Régions</div>
                    </div>
                  </div>
                  {provinceStats.map((p: any) => (
                    <div key={p.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{p.name}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{p.sirenes > 0 ? `${p.sirenes} sir.` : `${p.regions} rég.`}</span>
                      </div>
                      <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round((p.sirenes / maxSirenesByProvince) * 100) || Math.round((p.regions / Math.max(...provinceStats.map((x: any) => x.regions), 1)) * 100)}%`, background: "#3b82f6", borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "0.5px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                    <Activity size={13} color={activeSirenes === totalSirenes ? "#22c55e" : "#f59e0b"} />
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      <strong style={{ color: "#1e293b" }}>{activeSirenes}</strong> actives sur {totalSirenes}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: activeSirenes === totalSirenes ? "#15803d" : "#b45309", background: activeSirenes === totalSirenes ? "#f0fdf4" : "#fffbeb", padding: "2px 8px", borderRadius: 20 }}>
                      {totalSirenes > 0 ? Math.round((activeSirenes / totalSirenes) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Client : alertes par catégorie */
              <div className="panel" style={{ flex: 1 }}>
                <div className="panel-header">
                  <span className="panel-title">Alertes par catégorie — ce mois</span>
                </div>
                <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {categorieData.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune donnée</div>
                  ) : categorieData.map((c, i) => {
                    const max = categorieData[0].value;
                    return (
                      <div key={c.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{c.name}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{c.value}</span>
                        </div>
                        <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.round((c.value / max) * 100)}%`, background: ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444"][i] ?? "#3b82f6", borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Admin uniquement : top clients + sirènes hors ligne ── */}
        {isAdmin && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <div className="panel">
              <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Building2 size={14} color="#94a3b8" />
                <span className="panel-title">Top clients — alertes ce mois</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                {topCustomers.map((c: any) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "0.5px solid #f8fafc" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.sireneCount} sirène{c.sireneCount > 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{c.alertCount}</span>
                      {c.delta !== null && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: c.delta >= 0 ? "#f0fdf4" : "#fef2f2", color: c.delta >= 0 ? "#15803d" : "#b91c1c" }}>
                          {c.delta >= 0 ? "+" : ""}{c.delta}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {topCustomers.length === 0 && (
                  <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucun client</div>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldAlert size={14} color="#ef4444" />
                <span className="panel-title">Sirènes hors ligne — à traiter</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                {offlineSirenes.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                    ✓ Toutes les sirènes sont opérationnelles
                  </div>
                ) : offlineSirenes.slice(0, 5).map((s: any) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "0.5px solid #f8fafc" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {s.village?.name ?? "—"} · {isAdmin ? (s.customers?.[0]?.name ?? "Sans client") : ""}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, background: "#fef2f2", color: "#b91c1c", padding: "3px 8px", borderRadius: 20 }}>
                      Hors ligne
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Client uniquement : activité par sirène ── */}
        {!isAdmin && (
          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Radio size={14} color="#94a3b8" />
              <span className="panel-title">Vos sirènes — activité ce mois</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #f1f5f9" }}>
                    {["Sirène", "Zone", "Alertes ce mois", "Statut"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sireneActivity.map((s: any) => (
                    <tr key={s.id} style={{ borderBottom: "0.5px solid #f8fafc" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fafbff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      <td style={{ padding: "11px 16px", fontWeight: 500, color: "#1e293b" }}>{s.name}</td>
                      <td style={{ padding: "11px 16px", color: "#475569" }}>{s.village?.name ?? "—"}</td>
                      <td style={{ padding: "11px 16px", color: "#1e293b", fontWeight: 600 }}>{s.alertCount}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ background: s.isActive ? "#f0fdf4" : "#fef2f2", color: s.isActive ? "#15803d" : "#b91c1c", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                          {s.isActive ? "Active" : "Hors ligne"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}