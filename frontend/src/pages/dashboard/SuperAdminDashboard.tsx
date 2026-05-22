import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, AlertTriangle, CheckCircle, TrendingUp, MapPin, Activity, Building2, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { sirenesApi } from "@/services/sirene.api";
import { notificationsBngrcApi } from "@/services/notificationBngrc.api";
import { notificationsApi } from "@/services/notification.api";
import { provincesApi } from "@/services/province.api";
import { regionsApi } from "@/services/region.api";
import { customersApi } from "@/services/customers.api";
import { AppLayout } from "@/components/AppLayout";
import { useGreeting } from "@/hooks/useGreeting";
import { toArr, relativeTime, BarTooltip, StatCard, SeeAllBtn, CatBar, SC, CAT_COLORS, CAT_COLORS_CLIENT } from "./dashboard.helpers";
import "@/styles/page.css";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { greeting, firstName, period } = useGreeting();

  const today = new Date();
  const defStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const defEnd = today.toISOString().slice(0, 10);

  const [filterStart, setFilterStart] = useState(defStart);
  const [filterEnd, setFilterEnd] = useState(defEnd);
  const [applied, setApplied] = useState({ start: defStart, end: defEnd });

  // Queries globales administratives
  const { data: rawBngrcAll } = useQuery({ queryKey: ["sa-bngrc-all"], queryFn: () => notificationsBngrcApi.getAll({ limit: 2000 }) });
  const { data: rawBngrcFiltered } = useQuery({ queryKey: ["sa-bngrc-filtered", applied], queryFn: () => notificationsBngrcApi.getAll({ limit: 500, startDate: applied.start, endDate: applied.end }) });
  const { data: rawStatsBngrc } = useQuery({ queryKey: ["sa-bngrc-stats", applied], queryFn: () => notificationsBngrcApi.getStats({ startDate: applied.start, endDate: applied.end }) });
  const { data: rawClientAllAdmin } = useQuery({ queryKey: ["sa-client-all"], queryFn: () => notificationsApi.getAll({ limit: 2000 }) });
  const { data: rawClientFilteredAdmin } = useQuery({ queryKey: ["sa-client-filtered", applied], queryFn: () => notificationsApi.getAll({ limit: 500, startDate: applied.start, endDate: applied.end }) });
  const { data: rawSirenes } = useQuery({ queryKey: ["sirenes"], queryFn: () => sirenesApi.getAll() });
  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"], queryFn: () => provincesApi.getAll() });
  const { data: rawRegions } = useQuery({ queryKey: ["regions"], queryFn: () => regionsApi.getAll() });
  const { data: rawCustomers } = useQuery({ queryKey: ["customers"], queryFn: () => customersApi.getAll() });

  // Mémoires combinées
  const notifsAll = useMemo(() => [...toArr(rawBngrcAll), ...toArr(rawClientAllAdmin)], [rawBngrcAll, rawClientAllAdmin]);
  const notifsFiltered = useMemo(() => [...toArr(rawBngrcFiltered), ...toArr(rawClientFilteredAdmin)], [rawBngrcFiltered, rawClientFilteredAdmin]);
  const sirenes = useMemo(() => toArr(rawSirenes), [rawSirenes]);
  const provinces = useMemo(() => toArr(rawProvinces), [rawProvinces]);
  const regions = useMemo(() => toArr(rawRegions), [rawRegions]);
  const customers = useMemo(() => toArr(rawCustomers), [rawCustomers]);

  // Calculs Compteurs
  const totalSirenes = sirenes.length;
  const activeSirenes = sirenes.filter((s: any) => s.isActive).length;
  const inactiveSirenes = totalSirenes - activeSirenes;

  const totalSent = (rawStatsBngrc as any)?.sent ?? notifsFiltered.filter((n: any) => n.status === "sent").length;
  const totalFailed = (rawStatsBngrc as any)?.failed ?? notifsFiltered.filter((n: any) => n.status === "failed").length;
  const totalNotifs = (rawStatsBngrc as any)?.total ?? notifsFiltered.length;
  const successRate = totalNotifs > 0 ? Math.round((totalSent / (totalSent + totalFailed || 1)) * 1000) / 10 : 0;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(mStart);

  const alertesToday = useMemo(() => notifsAll.filter((n: any) => n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= todayStart).length, [notifsAll]);
  const alertesMonth = useMemo(() => notifsAll.filter((n: any) => n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= mStart).length, [notifsAll]);
  const alertesLastMonth = useMemo(() => notifsAll.filter((n: any) => n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= lastMonthStart && new Date(n.sendingTime ?? n.createdAt) < lastMonthEnd).length, [notifsAll]);
  const monthDelta = alertesLastMonth > 0 ? Math.round(((alertesMonth - alertesLastMonth) / alertesLastMonth) * 100) : null;

  // Chart Data
  const chartData = useMemo(() => {
    const start = new Date(applied.start + "T00:00:00");
    const end = new Date(applied.end + "T23:59:59");
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const days = Array.from({ length: Math.min(diffDays + 1, 60) }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0);
      return { date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), ts: d.getTime(), count: 0 };
    });
    notifsFiltered.forEach((n: any) => {
      if (n.status !== "sent" || !n.sendingTime) return;
      const day = days.find(d => d.ts === new Date(n.sendingTime).setHours(0, 0, 0, 0));
      if (day) day.count++;
    });
    return days;
  }, [notifsFiltered, applied]);

  // Catégories & Top clients
  const categoriesBngrc = useMemo(() => {
    const map = new Map<string, number>();
    toArr(rawBngrcFiltered).forEach((n: any) => {
      if (n.status !== "sent") return;
      const cat = n.categorieAlerteBngrc?.name ?? "Autre";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [rawBngrcFiltered]);

  const categoriesClient = useMemo(() => {
    const map = new Map<string, number>();
    toArr(rawClientFilteredAdmin).forEach((n: any) => {
      if (n.status !== "sent") return;
      const cat = n.sousCategorieAlerte?.name ?? n.categorieAlerte?.name ?? "Autre";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [rawClientFilteredAdmin]);

  const provinceStats = useMemo(() =>
    provinces.map((p: any) => ({
      name: p.name,
      regions: regions.filter((r: any) => Number(r.provinceId ?? r.province?.id) === p.id).length,
      sirenes: sirenes.filter((s: any) => Number(s.village?.fokontany?.commune?.district?.region?.provinceId) === p.id).length
    })).sort((a: any, b: any) => b.sirenes - a.sirenes).slice(0, 6),
  [provinces, regions, sirenes]);
  const maxSir = Math.max(...provinceStats.map((p: any) => p.sirenes), 1);

  const topCustomers = useMemo(() =>
    customers.map((c: any) => {
      const ids = sirenes.filter((s: any) => s.customers?.some((sc: any) => sc.id === c.id)).map((s: any) => s.id);
      const thisM = notifsAll.filter((n: any) => n.status === "sent" && ids.includes(n.sireneId) && new Date(n.sendingTime ?? n.createdAt) >= mStart).length;
      const lastM = notifsAll.filter((n: any) => n.status === "sent" && ids.includes(n.sireneId) && new Date(n.sendingTime ?? n.createdAt) >= lastMonthStart && new Date(n.sendingTime ?? n.createdAt) < lastMonthEnd).length;
      return { ...c, alertCount: thisM, delta: lastM > 0 ? Math.round(((thisM - lastM) / lastM) * 100) : null, sireneCount: ids.length };
    }).sort((a: any, b: any) => b.alertCount - a.alertCount).slice(0, 5),
  [customers, sirenes, notifsAll]);

  const lastNotifs = useMemo(() =>
    [...notifsFiltered]
      .filter((n: any) => n.sendingTime || n.createdAt)
      .sort((a: any, b: any) => new Date(b.sendingTime ?? b.createdAt).getTime() - new Date(a.sendingTime ?? a.createdAt).getTime())
      .slice(0, 6),
  [notifsFiltered]);

  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="page-title">{greeting}, {firstName || "SuperAdmin"} {period === "matin" ? "☀️" : period === "journée" ? "🌤️" : period === "soir" ? "🌙" : "🌃"}</h1>
            <p className="page-subtitle">Vue globale — alertes BNGRC & diffusions clients</p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "8px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <Calendar size={14} color="#64748b" />
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Période</span>
            <input type="date" value={filterStart} max={filterEnd} onChange={e => setFilterStart(e.target.value)} style={{ fontSize: 12, border: "none", outline: "none", background: "transparent" }} />
            <span style={{ color: "#cbd5e1" }}>→</span>
            <input type="date" value={filterEnd} min={filterStart} max={defEnd} onChange={e => setFilterEnd(e.target.value)} style={{ fontSize: 12, border: "none", outline: "none", background: "transparent" }} />
            <button onClick={() => setApplied({ start: filterStart, end: filterEnd })} style={{ fontSize: 12, fontWeight: 600, background: "#1a35a0", color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", cursor: "pointer" }}>Appliquer</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 14 }}>
          <StatCard title="Sirènes actives" value={`${activeSirenes}/${totalSirenes}`} sub={inactiveSirenes > 0 ? `${inactiveSirenes} hors ligne` : "Toutes opérationnelles"} icon={Radio} color="green" />
          <StatCard title="Alertes globales aujourd'hui" value={alertesToday} sub="Voir le détail" icon={AlertTriangle} color="amber" onClick={() => navigate("/notifications-alerte")} />
          <StatCard title="Alertes globales ce mois" value={alertesMonth} sub={monthDelta !== null ? `${monthDelta >= 0 ? "▲" : "▼"} ${Math.abs(monthDelta)}% vs mois dernier` : "Mois en cours"} icon={TrendingUp} color="navy" onClick={() => navigate("/notifications-alerte")} />
          <StatCard title="Taux de succès" value={`${successRate}%`} sub={`${totalFailed} échecs · ${totalNotifs} total`} icon={CheckCircle} color={successRate >= 95 ? "green" : successRate >= 80 ? "amber" : "red"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 24 }}>
          <StatCard title="Clients actifs" value={customers.filter((c: any) => c.isActive).length || customers.length} sub={`${totalSirenes} sirènes au total`} icon={Building2} color="teal" />
          <StatCard title="Provinces couvertes" value={provinces.length} sub={`${regions.length} régions`} icon={MapPin} color="slate" />
          <StatCard title="Alertes BNGRC" value={toArr(rawBngrcFiltered).filter((n: any) => n.status === "sent").length} sub="Sur la période filtrée" icon={AlertTriangle} color="red" onClick={() => navigate("/notifications-alerte")} />
          <StatCard title="Diffusions Clients" value={toArr(rawClientFilteredAdmin).filter((n: any) => n.status === "sent").length} sub="Sur la période filtrée" icon={Activity} color="purple" onClick={() => navigate("/notifications")} />
        </div>

        {/* Graphique */}
        <div style={{ marginBottom: 24 }}>
          <div className="panel">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="panel-title">Volume d'activité combiné ({applied.start} → {applied.end})</span>
            </div>
            <div className="panel-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip content={<BarTooltip vocabEnvois="activités" />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={i === chartData.length - 1 ? "#1a35a0" : "#bfdbfe"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Liste + Géo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginBottom: 24 }}>
          <div className="panel">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="panel-title">Flux en temps réel (Tout type)</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {lastNotifs.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Aucun flux sur cette période</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {["Sirène", "Catégorie", "Zone", "Statut", "Date"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#94a3b8", fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lastNotifs.map((n: any) => {
                      const sc = SC[n.status] ?? { label: n.status, color: "#64748b", bg: "#f8fafc" };
                      return (
                        <tr key={n.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                          <td style={{ padding: "11px 16px", fontWeight: 600 }}>{n.sirene?.name ?? `Sirène #${n.sireneId}`}</td>
                          <td style={{ padding: "11px 16px" }}>{n.categorieAlerteBngrc?.name ?? n.sousCategorieAlerte?.name ?? "Client Direct"}</td>
                          <td style={{ padding: "11px 16px" }}>{n.sirene?.village?.name ?? "—"}</td>
                          <td style={{ padding: "11px 16px" }}><span style={{ background: sc.bg, color: sc.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{sc.label}</span></td>
                          <td style={{ padding: "11px 16px", color: "#94a3b8" }}>{relativeTime(n.sendingTime ?? n.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><span className="panel-title">Couverture géographique</span></div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {provinceStats.map((p: any) => (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#475569" }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{p.sirenes} sir.</span>
                  </div>
                  <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round((p.sirenes / maxSir) * 100)}%`, background: "linear-gradient(90deg,#1d4ed8,#60a5fa)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Blocs Catégories Côte à Côte */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <div className="panel">
            <div className="panel-header"><span className="panel-title">Alertes BNGRC par catégorie</span></div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {categoriesBngrc.map((c, i) => (
                <CatBar key={c.name} name={c.name} value={c.value} max={categoriesBngrc[0]?.value || 1} color={CAT_COLORS[i] ?? "#3b82f6"} />
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><span className="panel-title">Diffusions Clients par catégorie</span></div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {categoriesClient.map((c, i) => (
                <CatBar key={c.name} name={c.name} value={c.value} max={categoriesClient[0]?.value || 1} color={CAT_COLORS_CLIENT[i] ?? "#ec4899"} />
              ))}
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Top Clients Proactifs (Ce mois)</span></div>
          <div className="panel-body" style={{ padding: 0 }}>
            {topCustomers.map((c: any, i: number) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name} ({c.sireneCount} sirènes)</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{c.alertCount} diffusions</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}