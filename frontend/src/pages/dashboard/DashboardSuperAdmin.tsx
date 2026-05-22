import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, AlertTriangle, CheckCircle, TrendingUp, MapPin, Activity, Building2, Calendar,} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { notificationsBngrcApi } from "@/services/notificationBngrc.api";
import { notificationsApi }      from "@/services/notification.api";
import { sirenesApi }            from "@/services/sirene.api";
import { provincesApi }          from "@/services/province.api";
import { regionsApi }            from "@/services/region.api";
import { customersApi }          from "@/services/customers.api";
import { AppLayout }             from "@/components/AppLayout";
import { useGreeting }           from "@/hooks/useGreeting";

import { StatCard }   from "./_shared/StatCard";
import { CatBar }     from "./_shared/CatBar";
import { SeeAllBtn }  from "./_shared/SeeAllBtn";
import { BarTooltip } from "./_shared/BarTooltip";
import { toArr, relativeTime, STATUS_CONFIG, CAT_COLORS, CAT_COLORS_CLIENT,} from "./_shared/helpers";

import "@/styles/page.css";

export default function DashboardSuperAdmin() {
  const navigate = useNavigate();
  const { greeting, firstName, period } = useGreeting();

  const today      = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const defStart   = monthStart.toISOString().slice(0, 10);
  const defEnd     = today.toISOString().slice(0, 10);

  const [filterStart, setFilterStart] = useState(defStart);
  const [filterEnd,   setFilterEnd]   = useState(defEnd);
  const [applied,     setApplied]     = useState({ start: defStart, end: defEnd });

  // ── Queries ──────────────────────────────────────────────────────────────

  // BNGRC — toutes (compteurs) + filtrées (graphique/liste)
  const { data: rawBngrcAll } = useQuery({
    queryKey: ["sa-bngrc-all"],
    queryFn:  () => notificationsBngrcApi.getAll({ limit: 2000 }),
  });
  const { data: rawBngrcFiltered } = useQuery({
    queryKey: ["sa-bngrc-filtered", applied],
    queryFn:  () => notificationsBngrcApi.getAll({ limit: 500, startDate: applied.start, endDate: applied.end }),
  });
  const { data: rawStatsBngrc } = useQuery({
    queryKey: ["sa-bngrc-stats", applied],
    queryFn:  () => notificationsBngrcApi.getStats({ startDate: applied.start, endDate: applied.end }),
  });

  // CLIENT — toutes (compteurs) + filtrées (graphique/liste)
  const { data: rawClientAll } = useQuery({
    queryKey: ["sa-client-all"],
    queryFn:  () => notificationsApi.getAll({ limit: 2000 }),
  });
  const { data: rawClientFiltered } = useQuery({
    queryKey: ["sa-client-filtered", applied],
    queryFn:  () => notificationsApi.getAll({ limit: 500, startDate: applied.start, endDate: applied.end }),
  });

  // Référentiels
  const { data: rawSirenes }   = useQuery({ queryKey: ["sirenes"],   queryFn: () => sirenesApi.getAll() });
  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"], queryFn: () => provincesApi.getAll() });
  const { data: rawRegions }   = useQuery({ queryKey: ["regions"],   queryFn: () => regionsApi.getAll() });
  const { data: rawCustomers } = useQuery({ queryKey: ["customers"], queryFn: () => customersApi.getAll() });

  // ── Normalisation ─────────────────────────────────────────────────────────

  const bngrcAll      = useMemo(() => toArr(rawBngrcAll),      [rawBngrcAll]);
  const bngrcFiltered = useMemo(() => toArr(rawBngrcFiltered), [rawBngrcFiltered]);
  const clientAll     = useMemo(() => toArr(rawClientAll),     [rawClientAll]);
  const clientFiltered= useMemo(() => toArr(rawClientFiltered),[rawClientFiltered]);
  const sirenes       = useMemo(() => toArr(rawSirenes),       [rawSirenes]);
  const provinces     = useMemo(() => toArr(rawProvinces),     [rawProvinces]);
  const regions       = useMemo(() => toArr(rawRegions),       [rawRegions]);
  const customers     = useMemo(() => toArr(rawCustomers),     [rawCustomers]);
  const statsBngrc    = rawStatsBngrc as any;

  // ── Calculs globaux ───────────────────────────────────────────────────────

  const totalSirenes    = sirenes.length;
  const activeSirenes   = sirenes.filter((s: any) => s.isActive).length;
  const inactiveSirenes = totalSirenes - activeSirenes;

  // Taux de succès BNGRC sur la période
  const bSent   = statsBngrc?.sent   ?? bngrcFiltered.filter((n: any) => n.status === "sent").length;
  const bFailed = statsBngrc?.failed ?? bngrcFiltered.filter((n: any) => n.status === "failed").length;
  const bTotal  = statsBngrc?.total  ?? bngrcFiltered.length;
  const bngrcSuccessRate = bTotal > 0
    ? Math.round((bSent / (bSent + bFailed || 1)) * 1000) / 10
    : 0;

  // Compteurs temporels — sur toutes les notifs (pas de filtre période)
  const todayStart     = new Date(); todayStart.setHours(0, 0, 0, 0);
  const mStart         = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(mStart);

  const bngrcToday = useMemo(() =>
    bngrcAll.filter((n: any) =>
      n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= todayStart
    ).length,
  [bngrcAll]);

  const bngrcMonth = useMemo(() =>
    bngrcAll.filter((n: any) =>
      n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= mStart
    ).length,
  [bngrcAll]);

  const bngrcLastMonth = useMemo(() =>
    bngrcAll.filter((n: any) =>
      n.status === "sent" &&
      new Date(n.sendingTime ?? n.createdAt) >= lastMonthStart &&
      new Date(n.sendingTime ?? n.createdAt) <  lastMonthEnd
    ).length,
  [bngrcAll]);

  const clientToday = useMemo(() =>
    clientAll.filter((n: any) =>
      n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= todayStart
    ).length,
  [clientAll]);

  const clientMonth = useMemo(() =>
    clientAll.filter((n: any) =>
      n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= mStart
    ).length,
  [clientAll]);

  const clientLastMonth = useMemo(() =>
    clientAll.filter((n: any) =>
      n.status === "sent" &&
      new Date(n.sendingTime ?? n.createdAt) >= lastMonthStart &&
      new Date(n.sendingTime ?? n.createdAt) <  lastMonthEnd
    ).length,
  [clientAll]);

  const bngrcMonthDelta = bngrcLastMonth > 0
    ? Math.round(((bngrcMonth - bngrcLastMonth) / bngrcLastMonth) * 100)
    : null;

  const clientMonthDelta = clientLastMonth > 0
    ? Math.round(((clientMonth - clientLastMonth) / clientLastMonth) * 100)
    : null;

  // ── Graphique combiné (période filtrée) ───────────────────────────────────
  // On affiche deux séries : alertes BNGRC + diffusions client

  const chartData = useMemo(() => {
    const start    = new Date(applied.start + "T00:00:00");
    const end      = new Date(applied.end   + "T23:59:59");
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const nDays    = Math.min(diffDays + 1, 60);
    const days = Array.from({ length: nDays }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0);
      return {
        date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        ts: d.getTime(),
        bngrc: 0,
        client: 0,
      };
    });
    bngrcFiltered.forEach((n: any) => {
      if (n.status !== "sent" || !n.sendingTime) return;
      const t   = new Date(n.sendingTime).setHours(0, 0, 0, 0);
      const day = days.find(d => d.ts === t);
      if (day) day.bngrc++;
    });
    clientFiltered.forEach((n: any) => {
      if (n.status !== "sent" || !n.sendingTime) return;
      const t   = new Date(n.sendingTime).setHours(0, 0, 0, 0);
      const day = days.find(d => d.ts === t);
      if (day) day.client++;
    });
    return days;
  }, [bngrcFiltered, clientFiltered, applied]);

  // ── Catégories (période filtrée) ──────────────────────────────────────────

  const categoriesBngrc = useMemo(() => {
    const map = new Map<string, number>();
    bngrcFiltered.forEach((n: any) => {
      if (n.status !== "sent") return;
      const cat = n.categorieAlerteBngrc?.name ?? "Autre";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [bngrcFiltered]);

  const categoriesClient = useMemo(() => {
    const map = new Map<string, number>();
    clientFiltered.forEach((n: any) => {
      if (n.status !== "sent") return;
      const cat = n.sousCategorieAlerte?.name ?? n.categorieAlerte?.name ?? "Autre";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [clientFiltered]);

  // ── Couverture géographique ───────────────────────────────────────────────

  const provinceStats = useMemo(() =>
    provinces.map((p: any) => {
      const regionCount = regions.filter((r: any) =>
        Number(r.provinceId ?? r.province?.id) === p.id
      ).length;
      const sireneCount = sirenes.filter((s: any) =>
        Number(s.village?.fokontany?.commune?.district?.region?.provinceId) === p.id
      ).length;
      return { name: p.name, regions: regionCount, sirenes: sireneCount };
    }).sort((a: any, b: any) => b.sirenes - a.sirenes).slice(0, 6),
  [provinces, regions, sirenes]);

  const maxSir = Math.max(...provinceStats.map((p: any) => p.sirenes), 1);
  const maxReg = Math.max(...provinceStats.map((p: any) => p.regions), 1);

  // ── Top clients (mois en cours, sur notifsAll) ────────────────────────────

  const topCustomers = useMemo(() =>
    customers
      .map((c: any) => {
        const sids = sirenes
          .filter((s: any) => s.customers?.some((sc: any) => sc.id === c.id))
          .map((s: any) => s.id);
        const thisM = clientAll.filter((n: any) =>
          n.status === "sent" && sids.includes(n.sireneId) &&
          new Date(n.sendingTime ?? n.createdAt) >= mStart
        ).length;
        const lastM = clientAll.filter((n: any) =>
          n.status === "sent" && sids.includes(n.sireneId) &&
          new Date(n.sendingTime ?? n.createdAt) >= lastMonthStart &&
          new Date(n.sendingTime ?? n.createdAt) <  lastMonthEnd
        ).length;
        const delta = lastM > 0 ? Math.round(((thisM - lastM) / lastM) * 100) : null;
        return { ...c, alertCount: thisM, delta, sireneCount: sids.length };
      })
      .sort((a: any, b: any) => b.alertCount - a.alertCount)
      .slice(0, 5),
  [customers, sirenes, clientAll]);

  // ── Dernières alertes BNGRC (période filtrée) ─────────────────────────────

  const lastBngrcNotifs = useMemo(() =>
    [...bngrcFiltered]
      .filter((n: any) => n.sendingTime || n.createdAt)
      .sort((a: any, b: any) =>
        new Date(b.sendingTime ?? b.createdAt).getTime() -
        new Date(a.sendingTime ?? a.createdAt).getTime()
      )
      .slice(0, 5),
  [bngrcFiltered]);

  // ── Dernières diffusions client (période filtrée) ─────────────────────────

  const lastClientNotifs = useMemo(() =>
    [...clientFiltered]
      .filter((n: any) => n.sendingTime || n.createdAt)
      .sort((a: any, b: any) =>
        new Date(b.sendingTime ?? b.createdAt).getTime() -
        new Date(a.sendingTime ?? a.createdAt).getTime()
      )
      .slice(0, 5),
  [clientFiltered]);

  // ─────────────────────────────────────────────────────────────────────────

  const dateLabel = applied.start === applied.end
    ? new Date(applied.start).toLocaleDateString("fr-FR")
    : `${new Date(applied.start).toLocaleDateString("fr-FR")} → ${new Date(applied.end).toLocaleDateString("fr-FR")}`;

  return (
    <AppLayout>
      <div className="page-wrap">

        {/* ── Header ── */}
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="page-title">
              {greeting}{firstName ? `, ${firstName}` : ""}
              <span style={{ marginLeft: 6 }}>
                {period === "matin" ? "☀️" : period === "journée" ? "🌤️" : period === "soir" ? "🌙" : "🌃"}
              </span>
            </h1>
            <p className="page-subtitle">Vue globale — alertes BNGRC & diffusions clients</p>
          </div>

          {/* Filtre date */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: "8px 14px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <Calendar size={14} color="#64748b" />
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Période</span>
            <input type="date" value={filterStart} max={filterEnd}
              onChange={e => setFilterStart(e.target.value)}
              style={{ fontSize: 12, border: "none", outline: "none", color: "#1e293b", background: "transparent" }} />
            <span style={{ color: "#cbd5e1" }}>→</span>
            <input type="date" value={filterEnd} min={filterStart} max={defEnd}
              onChange={e => setFilterEnd(e.target.value)}
              style={{ fontSize: 12, border: "none", outline: "none", color: "#1e293b", background: "transparent" }} />
            <button onClick={() => setApplied({ start: filterStart, end: filterEnd })} style={{
              fontSize: 12, fontWeight: 600, background: "#1a35a0", color: "#fff",
              border: "none", borderRadius: 8, padding: "5px 14px", cursor: "pointer",
            }}>
              Appliquer
            </button>
          </div>
        </div>

        {/* ── Row 1 : Infrastructure ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 14 }}>
          <StatCard
            title="Sirènes actives"
            value={`${activeSirenes}/${totalSirenes}`}
            sub={inactiveSirenes > 0 ? `${inactiveSirenes} hors ligne` : "Toutes opérationnelles"}
            icon={Radio} color="green"
          />
          <StatCard
            title="Clients actifs"
            value={customers.filter((c: any) => c.isActive).length || customers.length}
            sub={`${totalSirenes} sirènes au total`}
            icon={Building2} color="teal"
          />
          <StatCard
            title="Provinces couvertes"
            value={provinces.length}
            sub={`${regions.length} régions`}
            icon={MapPin} color="slate"
          />
          <StatCard
            title="Taux de succès alertes"
            value={`${bngrcSuccessRate}%`}
            sub={`${bFailed} échec${bFailed > 1 ? "s" : ""} · ${bTotal} total`}
            icon={CheckCircle}
            color={bngrcSuccessRate >= 95 ? "green" : bngrcSuccessRate >= 80 ? "amber" : "red"}
          />
        </div>

        {/* ── Row 2 : BNGRC vs Client ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 24 }}>
          <StatCard
            title="Alertes aujourd'hui"
            value={bngrcToday}
            sub="Voir le détail"
            icon={AlertTriangle} color="red"
            onClick={() => navigate("/notifications-alerte")}
          />
          <StatCard
            title="Alertes — mois en cours"
            value={bngrcMonth}
            sub={bngrcMonthDelta !== null
              ? `${bngrcMonthDelta >= 0 ? "▲" : "▼"} ${Math.abs(bngrcMonthDelta)}% vs mois dernier`
              : "Mois en cours"}
            icon={TrendingUp} color="amber"
            onClick={() => navigate("/notifications-alerte")}
          />
          <StatCard
            title="Diffusions aujourd'hui"
            value={clientToday}
            sub="Voir le détail"
            icon={Activity} color="purple"
            onClick={() => navigate("/notifications")}
          />
          <StatCard
            title="Diffusions — mois en cours"
            value={clientMonth}
            sub={clientMonthDelta !== null
              ? `${clientMonthDelta >= 0 ? "▲" : "▼"} ${Math.abs(clientMonthDelta)}% vs mois dernier`
              : "Mois en cours"}
            icon={TrendingUp} color="navy"
            onClick={() => navigate("/notifications")}
          />
        </div>

        {/* ── Graphique combiné ── */}
        <div style={{ marginBottom: 24 }}>
          <div className="panel">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="panel-title">Activité globale — {dateLabel}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444" }} />
                  <span style={{ fontSize: 11, color: "#64748b" }}>Alertes BNGRC</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "#7c3aed" }} />
                  <span style={{ fontSize: 11, color: "#64748b" }}>Diffusions clients</span>
                </div>
                <SeeAllBtn onClick={() => navigate("/notifications-alerte")} label="Voir alertes" />
                <SeeAllBtn onClick={() => navigate("/notifications")} label="Voir diffusions" />
              </div>
            </div>
            <div className="panel-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
                      labelStyle={{ fontSize: 11, color: "#94a3b8" }}
                      cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    />
                    <Bar dataKey="bngrc" name="Alertes BNGRC" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="client" name="Diffusions clients" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── Alertes BNGRC : liste + catégories ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            ▌ Alertes BNGRC
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginBottom: 24 }}>
          <div className="panel">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="panel-title">Dernières alertes</span>
              <SeeAllBtn onClick={() => navigate("/notifications-alerte")} />
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {lastBngrcNotifs.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune alerte</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {["Sirène", "Catégorie", "Zone", "Statut", "Date", "Il y a"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lastBngrcNotifs.map((n: any) => {
                      const sc = STATUS_CONFIG[n.status] ?? { label: n.status, color: "#64748b", bg: "#f8fafc" };
                      const sendDate = n.sendingTime
                        ? new Date(n.sendingTime).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })
                        : "—";
                      return (
                        <tr key={n.id}
                          style={{ borderBottom: "1px solid #f8fafc", cursor: "pointer", transition: "background 0.12s" }}
                          onClick={() => navigate("/notifications-alerte")}
                          onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
                          onMouseLeave={e => (e.currentTarget.style.background = "")}
                        >
                          <td style={{ padding: "11px 16px", fontWeight: 600, color: "#1e293b", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.sirene?.name ?? `Sirène #${n.sireneId}`}
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.categorieAlerteBngrc?.name ?? "—"}
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.sirene?.village?.name ?? "—"}
                          </td>
                          <td style={{ padding: "11px 16px" }}>
                            <span style={{ background: sc.bg, color: sc.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569", fontSize: 12 }}>{sendDate}</td>
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
            <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span className="panel-title">Alertes par catégorie</span>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {categoriesBngrc.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune donnée</div>
              ) : categoriesBngrc.map((c, i) => (
                <CatBar key={c.name} name={c.name} value={c.value} max={categoriesBngrc[0].value} color={CAT_COLORS[i] ?? "#3b82f6"} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Diffusions clients : liste + catégories ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            ▌ Diffusions clients
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginBottom: 24 }}>
          <div className="panel">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="panel-title">Dernières diffusions</span>
              <SeeAllBtn onClick={() => navigate("/notifications")} />
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {lastClientNotifs.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune diffusion</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {["Sirène", "Catégorie", "Zone", "Statut", "Date", "Il y a"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lastClientNotifs.map((n: any) => {
                      const sc = STATUS_CONFIG[n.status] ?? { label: n.status, color: "#64748b", bg: "#f8fafc" };
                      const sendDate = n.sendingTime
                        ? new Date(n.sendingTime).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })
                        : "—";
                      return (
                        <tr key={n.id}
                          style={{ borderBottom: "1px solid #f8fafc", cursor: "pointer", transition: "background 0.12s" }}
                          onClick={() => navigate("/notifications")}
                          onMouseEnter={e => (e.currentTarget.style.background = "#fdf4ff")}
                          onMouseLeave={e => (e.currentTarget.style.background = "")}
                        >
                          <td style={{ padding: "11px 16px", fontWeight: 600, color: "#1e293b", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.sirene?.name ?? `Sirène #${n.sireneId}`}
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.sousCategorieAlerte?.name ?? n.categorieAlerte?.name ?? "—"}
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.sirene?.village?.name ?? "—"}
                          </td>
                          <td style={{ padding: "11px 16px" }}>
                            <span style={{ background: sc.bg, color: sc.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ padding: "11px 16px", color: "#475569", fontSize: 12 }}>{sendDate}</td>
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
            <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={14} color="#7c3aed" />
              <span className="panel-title">Diffusions par catégorie</span>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {categoriesClient.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune donnée</div>
              ) : categoriesClient.map((c, i) => (
                <CatBar key={c.name} name={c.name} value={c.value} max={categoriesClient[0].value} color={CAT_COLORS_CLIENT[i] ?? "#ec4899"} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Couverture géographique + Top clients ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>

          {/* Couverture géographique */}
          <div className="panel">
            <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={14} color="#94a3b8" />
              <span className="panel-title">Couverture géographique</span>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1d4ed8" }}>{provinces.length}</div>
                  <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>Provinces</div>
                </div>
                <div style={{ background: "linear-gradient(135deg,#f0fdfa,#ccfbf1)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f766e" }}>{regions.length}</div>
                  <div style={{ fontSize: 11, color: "#14b8a6", fontWeight: 600 }}>Régions</div>
                </div>
              </div>
              {provinceStats.map((p: any) => (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      {p.sirenes > 0 ? `${p.sirenes} sir.` : `${p.regions} rég.`}
                    </span>
                  </div>
                  <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${p.sirenes > 0
                        ? Math.round((p.sirenes / maxSir) * 100)
                        : Math.round((p.regions / maxReg) * 100)}%`,
                      background: "linear-gradient(90deg,#1d4ed8,#60a5fa)",
                      borderRadius: 3, transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={13} color={activeSirenes === totalSirenes ? "#22c55e" : "#f59e0b"} />
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  <strong style={{ color: "#1e293b" }}>{activeSirenes}</strong> actives sur {totalSirenes}
                </span>
                <span style={{
                  marginLeft: "auto", fontSize: 11, fontWeight: 700,
                  color: activeSirenes === totalSirenes ? "#15803d" : "#b45309",
                  background: activeSirenes === totalSirenes ? "#dcfce7" : "#fef3c7",
                  padding: "2px 9px", borderRadius: 20,
                }}>
                  {totalSirenes > 0 ? Math.round((activeSirenes / totalSirenes) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Top clients */}
          <div className="panel">
            <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={14} color="#94a3b8" />
              <span className="panel-title">Top clients — diffusions ce mois</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {topCustomers.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucun client</div>
              ) : topCustomers.map((c: any, i: number) => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 16px", borderBottom: "1px solid #f8fafc", transition: "background 0.12s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: `${CAT_COLORS_CLIENT[i % CAT_COLORS_CLIENT.length]}22`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: CAT_COLORS_CLIENT[i % CAT_COLORS_CLIENT.length],
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.sireneCount} sirène{c.sireneCount > 1 ? "s" : ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{c.alertCount}</span>
                    {c.delta !== null && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                        background: c.delta >= 0 ? "#dcfce7" : "#fee2e2",
                        color: c.delta >= 0 ? "#15803d" : "#b91c1c",
                      }}>
                        {c.delta >= 0 ? "▲" : "▼"}{Math.abs(c.delta)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}