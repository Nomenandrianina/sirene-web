import { useMemo } from "react";
import { Radio, AlertTriangle, CheckCircle, TrendingUp, Clock, XCircle, MapPin, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { sirenesApi }       from "@/services/sirene.api";
import { notificationsApi } from "@/services/notification.api";
import { provincesApi }     from "@/services/province.api";
import { regionsApi }       from "@/services/region.api";
import { AppLayout }        from "@/components/AppLayout";
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

  // ── Données brutes ────────────────────────────────────────────────
  const { data: rawSirenes }       = useQuery({ queryKey: ["sirenes"],            queryFn: () => sirenesApi.getAll() });
  const { data: rawStats }         = useQuery({ queryKey: ["notif-stats"],        queryFn: () => notificationsApi.getStats() });
  const { data: rawNotifs }        = useQuery({ queryKey: ["notifications-all"],  queryFn: () => notificationsApi.getAll({ limit: 500 }) });
  const { data: rawProvinces }     = useQuery({ queryKey: ["provinces"],          queryFn: () => provincesApi.getAll() });
  const { data: rawRegions }       = useQuery({ queryKey: ["regions"],            queryFn: () => regionsApi.getAll() });

  const sirenes   = useMemo(() => toArr(rawSirenes),   [rawSirenes]);
  const notifs    = useMemo(() => toArr(rawNotifs),    [rawNotifs]);
  const provinces = useMemo(() => toArr(rawProvinces), [rawProvinces]);
  const regions   = useMemo(() => toArr(rawRegions),   [rawRegions]);
  const stats     = rawStats as any;

  // ── Calculs sirènes ───────────────────────────────────────────────
  const totalSirenes  = sirenes.length;
  const activeSirenes = sirenes.filter((s: any) => s.isActive).length;
  const inactiveSirenes = totalSirenes - activeSirenes;

  // ── Calculs notifications ──────────────────────────────────────────
  // On préfère /notifications/stats si disponible, sinon on calcule
  const totalSent    = stats?.sent    ?? notifs.filter((n: any) => n.status === "sent").length;
  const totalFailed  = stats?.failed  ?? notifs.filter((n: any) => n.status === "failed").length;
  const totalPending = stats?.pending ?? notifs.filter((n: any) => n.status === "pending").length;
  const totalNotifs  = stats?.total   ?? notifs.length;

  const successRate = totalNotifs > 0
    ? Math.round((totalSent / (totalSent + totalFailed || 1)) * 1000) / 10
    : 0;

  // Alertes aujourd'hui
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const alertesToday = notifs.filter((n: any) =>
    n.status === "sent" && new Date(n.sendingTime) >= todayStart
  ).length;

  // Alertes ce mois
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const alertesMonth = notifs.filter((n: any) =>
    n.status === "sent" && new Date(n.sendingTime) >= monthStart
  ).length;

  // ── Graphique barres 14j ──────────────────────────────────────────
  const chartData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      d.setHours(0, 0, 0, 0);
      return { date: fmtDate(d), ts: d.getTime(), count: 0 };
    });
    notifs.forEach((n: any) => {
      if (n.status !== "sent" || !n.sendingTime) return;
      const t = new Date(n.sendingTime).setHours(0, 0, 0, 0);
      const day = days.find(d => d.ts === t);
      if (day) day.count++;
    });
    return days;
  }, [notifs]);

  // ── Données donut statuts ─────────────────────────────────────────
  const donutData = [
    { name: "Envoyés",   value: totalSent,    color: "#22c55e" },
    { name: "Échoués",   value: totalFailed,  color: "#ef4444" },
    { name: "En attente",value: totalPending, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  // ── Couverture par province ───────────────────────────────────────
  // Pour chaque province : nb sirènes actives / nb sirènes totales
  const provinceStats = useMemo(() => {
    return provinces.map((p: any) => {
      // Remonter province → régions → villages → sirènes
      // On approxime avec les données disponibles côté frontend
      // (sans endpoint dédié, on fait une estimation simple)
      const regionCount = regions.filter((r: any) =>
        Number(r.provinceId ?? r.province_id) === p.id
      ).length;
      return { name: p.name, regions: regionCount };
    }).sort((a: any, b: any) => b.regions - a.regions).slice(0, 6);
  }, [provinces, regions]);

  // ── 5 dernières notifications ─────────────────────────────────────
  const lastNotifs = useMemo(() => {
    return [...notifs]
      .filter((n: any) => n.sendingTime || n.createdAt)
      .sort((a: any, b: any) =>
        new Date(b.sendingTime ?? b.createdAt).getTime() -
        new Date(a.sendingTime ?? a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [notifs]);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    sent:    { label: "Envoyé",     color: "#15803d", bg: "#f0fdf4" },
    failed:  { label: "Échoué",     color: "#b91c1c", bg: "#fef2f2" },
    pending: { label: "En attente", color: "#b45309", bg: "#fffbeb" },
  };

  // ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="page-wrap">

        {/* ── Header ── */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Vue d'ensemble du système d'alertes</p>
          </div>
        </div>

        {/* ── Stat cards ── */}
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
            sub="Depuis minuit"
            icon={AlertTriangle} color="amber"
          />
          <StatCard
            title="Alertes ce mois"
            value={alertesMonth}
            sub="Mois en cours"
            icon={TrendingUp} color="blue"
          />
          <StatCard
            title="Taux de succès"
            value={`${successRate}%`}
            sub={`${totalFailed} échec${totalFailed > 1 ? "s" : ""} total`}
            icon={CheckCircle} color={successRate >= 95 ? "green" : successRate >= 80 ? "amber" : "red"}
          />
        </div>

        {/* ── Ligne 2 : barres + donut ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, marginBottom: 24 }}>

          {/* Graphique barres 14j */}
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

          {/* Donut statuts */}
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
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
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

        {/* ── Ligne 3 : dernières notifs + couverture provinces ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>

          {/* Dernières notifications */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Dernières notifications</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {lastNotifs.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune notification</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid #f1f5f9" }}>
                      {["Message", "Sirène", "Téléphone", "Statut", "Il y a"].map(h => (
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
                          <td style={{ padding: "11px 16px", fontFamily: "monospace", fontSize: 12, color: "#1e293b", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.message}
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569" }}>
                            {n.sirene?.name ?? n.sireneId ?? "—"}
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569" }}>
                            {n.phoneNumber ?? "—"}
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

          {/* Couverture par province */}
          <div className="panel">
            <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={14} color="#94a3b8" />
              <span className="panel-title">Couverture géographique</span>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>

              {/* Résumé rapide */}
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

              {/* Barres par province */}
              {provinceStats.map((p: any) => {
                const maxRegions = Math.max(...provinceStats.map((x: any) => x.regions), 1);
                const pct = Math.round((p.regions / maxRegions) * 100);
                return (
                  <div key={p.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{p.regions} rég.</span>
                    </div>
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "#3b82f6", borderRadius: 3, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}

              {/* Indicateur sirènes actives */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "0.5px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={13} color={activeSirenes === totalSirenes ? "#22c55e" : "#f59e0b"} />
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  <strong style={{ color: "#1e293b" }}>{activeSirenes}</strong> sirène{activeSirenes > 1 ? "s" : ""} active{activeSirenes > 1 ? "s" : ""} sur {totalSirenes}
                </span>
                <span style={{
                  marginLeft: "auto", fontSize: 11, fontWeight: 600,
                  color: activeSirenes === totalSirenes ? "#15803d" : "#b45309",
                  background: activeSirenes === totalSirenes ? "#f0fdf4" : "#fffbeb",
                  padding: "2px 8px", borderRadius: 20,
                }}>
                  {totalSirenes > 0 ? Math.round((activeSirenes / totalSirenes) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}