import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, AlertTriangle, TrendingUp, Calendar, Music2, User, Building2,} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { notificationsBngrcApi } from "@/services/notificationBngrc.api";
import { sirenesApi }            from "@/services/sirene.api";
import { audioAlerteBngrcApi }   from "@/services/audioAlerteBngrc.api";
import { AppLayout }             from "@/components/AppLayout";
import { useGreeting }           from "@/hooks/useGreeting";

import { StatCard }   from "./_shared/StatCard";
import { CatBar }     from "./_shared/CatBar";
import { SeeAllBtn }  from "./_shared/SeeAllBtn";
import { BarTooltip } from "./_shared/BarTooltip";
import { toArr, relativeTime, STATUS_CONFIG, CAT_COLORS } from "./_shared/helpers";

import "@/styles/page.css";


export default function DashboardBngrc() {
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
  
    const { data: rawAll } = useQuery({
      queryKey: ["bngrc-notifs-all"],
      queryFn:  () => notificationsBngrcApi.getAll({ limit: 2000 }),
    });
  
    const { data: rawFiltered } = useQuery({
      queryKey: ["bngrc-notifs-filtered", applied],
      queryFn:  () => notificationsBngrcApi.getAll({
        limit: 500, startDate: applied.start, endDate: applied.end,
      }),
    });
  
    const { data: rawStats } = useQuery({
      queryKey: ["bngrc-stats", applied],
      queryFn:  () => notificationsBngrcApi.getStats({
        startDate: applied.start, endDate: applied.end,
      }),
    });
  
    const { data: rawSirenes } = useQuery({
      queryKey: ["sirenes"],
      queryFn:  () => sirenesApi.getAll(),
    });
  
    // Audios BNGRC disponibles — pour la 4ème stat card
    const { data: rawAudios } = useQuery({
      queryKey: ["audio-alerte-bngrc"],
      queryFn:  () => audioAlerteBngrcApi.getAll(),
    });
  
    // ── Normalisation ─────────────────────────────────────────────────────────
    const notifsAll      = useMemo(() => toArr(rawAll),      [rawAll]);
    const notifsFiltered = useMemo(() => toArr(rawFiltered), [rawFiltered]);
    const sirenes        = useMemo(() => toArr(rawSirenes),  [rawSirenes]);
    const audios         = useMemo(() => toArr(rawAudios),   [rawAudios]);
    const stats          = rawStats as any;
    
    // ── Calculs ───────────────────────────────────────────────────────────────
  
    const totalSirenes    = sirenes.length;
    const activeSirenes   = sirenes.filter((s: any) => s.isActive).length;
    const inactiveSirenes = totalSirenes - activeSirenes;
  
    // Stats sur la période (pour sous-texte uniquement, taux supprimé)
    const totalSent   = stats?.sent   ?? notifsFiltered.filter((n: any) => n.status === "sent").length;
    const totalFailed = stats?.failed ?? notifsFiltered.filter((n: any) => n.status === "failed").length;
  
    // Audios — nombre total + catégories couvertes
    const totalAudios      = audios.length;
    const categoriesAudio  = new Set(
      audios
        .map((a: any) => a.categorieAlerteBngrcId)
        .filter((id: any) => id != null)
    ).size;
  
    const todayStart     = new Date(); todayStart.setHours(0, 0, 0, 0);
    const mStart         = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(mStart);
  
    const alertesToday = useMemo(() =>
      notifsAll.filter((n: any) =>
        n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= todayStart
      ).length,
    [notifsAll]);
  
    const alertesMonth = useMemo(() =>
      notifsAll.filter((n: any) =>
        n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= mStart
      ).length,
    [notifsAll]);
  
    const alertesLastMonth = useMemo(() =>
      notifsAll.filter((n: any) =>
        n.status === "sent" &&
        new Date(n.sendingTime ?? n.createdAt) >= lastMonthStart &&
        new Date(n.sendingTime ?? n.createdAt) <  lastMonthEnd
      ).length,
    [notifsAll]);
  
    const monthDelta = alertesLastMonth > 0
      ? Math.round(((alertesMonth - alertesLastMonth) / alertesLastMonth) * 100)
      : null;
  
    // ── Graphique ─────────────────────────────────────────────────────────────
  
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
          count: 0,
        };
      });
      notifsFiltered.forEach((n: any) => {
        if (n.status !== "sent" || !n.sendingTime) return;
        const t   = new Date(n.sendingTime).setHours(0, 0, 0, 0);
        const day = days.find(d => d.ts === t);
        if (day) day.count++;
      });
      return days;
    }, [notifsFiltered, applied]);
  
    // ── Catégories ────────────────────────────────────────────────────────────
  
    const categories = useMemo(() => {
      const map = new Map<string, number>();
      notifsFiltered.forEach((n: any) => {
        if (n.status !== "sent") return;
        const cat = n.categorieAlerteBngrc?.name ?? "Autre";
        map.set(cat, (map.get(cat) ?? 0) + 1);
      });
      return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    }, [notifsFiltered]);
  
    // ── Activité sirènes ──────────────────────────────────────────────────────
  
    const sireneActivity = useMemo(() =>
      sirenes
        .map((s: any) => ({
          ...s,
          alertCount: notifsFiltered.filter((n: any) =>
            n.status === "sent" && n.sireneId === s.id
          ).length,
        }))
        .sort((a: any, b: any) => b.alertCount - a.alertCount)
        .slice(0, 5),
    [sirenes, notifsFiltered]);
  
    // ── Dernières alertes ─────────────────────────────────────────────────────
    // Inclut customer + user directement depuis la relation de la notif
  
    const lastNotifs = useMemo(() =>
      [...notifsFiltered]
        .filter((n: any) => n.sendingTime || n.createdAt)
        .sort((a: any, b: any) =>
          new Date(b.sendingTime ?? b.createdAt).getTime() -
          new Date(a.sendingTime ?? a.createdAt).getTime()
        )
        .slice(0, 8),
    [notifsFiltered]);
  
    // ── Helpers affichage ─────────────────────────────────────────────────────
  
    function getUserLabel(n: any): string {
      const u = n.user;
      if (!u) return "—";
      const first = u.first_name ?? "";
      const last  = u.last_name  ?? "";
      const full  = `${first} ${last}`.trim();
      return full || u.email || "—";
    }
  
    function getCustomerLabel(n: any): string {
      // user.customer est jointé côté backend via ManyToOne Customer
      const c = n.user?.customer;
      if (!c) return "—";
      return c.name ?? c.companyName ?? "—";
    }
  
    // ─────────────────────────────────────────────────────────────────────────
  
    const dateLabel = applied.start === applied.end
      ? new Date(applied.start).toLocaleDateString("fr-FR")
      : `${new Date(applied.start).toLocaleDateString("fr-FR")} → ${new Date(applied.end).toLocaleDateString("fr-FR")}`;
  
    return (
      <AppLayout>
          <div className="page-wrap"
            style={{
              minHeight: "100vh",
              backgroundImage:  "linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url('/images/sirene.jpeg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          >  

        {/* <div
          className="page-wrap"
          style={{
            backgroundImage: "url('/images/sirene.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            minHeight: "100vh",
          }}
        > */}

          {/* ── Header ── */}
          <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 className="page-title">
                {greeting}{firstName ? `, ${firstName}` : ""}
                <span style={{ marginLeft: 6 }}>
                  {period === "matin" ? "☀️" : period === "journée" ? "🌤️" : period === "soir" ? "🌙" : "🌃"}
                </span>
              </h1>
              <p className="page-subtitle">Tableau de bord</p>
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
              <button
                onClick={() => setApplied({ start: filterStart, end: filterEnd })}
                style={{
                  fontSize: 12, fontWeight: 600, background: "#1a35a0", color: "#fff",
                  border: "none", borderRadius: 8, padding: "5px 14px", cursor: "pointer",
                }}
              >
                Appliquer
              </button>
            </div>
          </div>
  
          {/* ── Row 1 : 4 stat cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 24 }}>
            <StatCard
              title="Sirènes actives"
              value={`${activeSirenes}/${totalSirenes}`}
              sub={inactiveSirenes > 0 ? `${inactiveSirenes} hors ligne` : "Toutes opérationnelles"}
              icon={Radio} color="green"
            />
            <StatCard
              title="Alertes aujourd'hui"
              value={alertesToday}
              sub={`${totalFailed > 0 ? `${totalFailed} échec${totalFailed > 1 ? "s" : ""} · ` : ""}Voir le détail`}
              icon={AlertTriangle} color="amber"
              onClick={() => navigate("/notifications-alerte")}
            />
            <StatCard
              title="Alertes — mois en cours"
              value={alertesMonth}
              sub={monthDelta !== null
                ? `${monthDelta >= 0 ? "▲" : "▼"} ${Math.abs(monthDelta)}% vs mois dernier`
                : "Mois en cours"}
              icon={TrendingUp} color="navy"
              onClick={() => navigate("/notifications-alerte")}
            />
            <StatCard
              title="Audios disponibles"
              value={totalAudios}
              sub={categoriesAudio > 0
                ? `${categoriesAudio} catégorie${categoriesAudio > 1 ? "s" : ""} couverte${categoriesAudio > 1 ? "s" : ""}`
                : "Aucune catégorie associée"}
              icon={Music2} color="teal"
            />
          </div>
  
          {/* ── Graphique ── */}
          <div style={{ marginBottom: 24 }}>
            <div className="panel">
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="panel-title">Alertes envoyées — {dateLabel}</span>
                <SeeAllBtn onClick={() => navigate("/notifications-alerte")} />
              </div>
              <div className="panel-body">
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="40%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                      <Tooltip content={<BarTooltip vocabEnvois="alertes" />} cursor={{ fill: "rgba(0,0,0,0.02)", radius: 6 }} />
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
  
          {/* ── Liste des alertes + catégories ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginBottom: 24 }}>
  
            {/* Tableau dernières alertes */}
            <div className="panel">
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="panel-title">Dernières alertes</span>
                <SeeAllBtn onClick={() => navigate("/notifications-alerte")} />
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                {lastNotifs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune alerte</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {["Sirène", "Catégorie", "Zone", "Client", "Envoyé par", "Statut", "Il y a"].map(h => (
                          <th key={h} style={{
                            padding: "10px 14px", textAlign: "left", fontWeight: 600,
                            color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em",
                            whiteSpace: "nowrap",
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lastNotifs.map((n: any) => {
                        const sc = STATUS_CONFIG[n.status] ?? { label: n.status, color: "#64748b", bg: "#f8fafc" };
                        const customerLabel = getCustomerLabel(n);
                        const userLabel     = getUserLabel(n);
                        return (
                          <tr
                            key={n.id}
                            style={{ borderBottom: "1px solid #f8fafc", cursor: "pointer", transition: "background 0.12s" }}
                            onClick={() => navigate("/notifications-alerte")}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f0f6ff")}
                            onMouseLeave={e => (e.currentTarget.style.background = "")}
                          >
                            {/* Sirène */}
                            <td style={{ padding: "11px 14px", fontWeight: 600, color: "#1e293b", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {n.sirene?.name ?? `Sirène #${n.sireneId}`}
                            </td>
  
                            {/* Catégorie */}
                            <td style={{ padding: "11px 14px", color: "#475569", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {n.categorieAlerteBngrc?.name ?? "—"}
                            </td>
  
                            {/* Zone */}
                            <td style={{ padding: "11px 14px", color: "#475569", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {n.sirene?.village?.name ?? "—"}
                            </td>
  
                            {/* Client */}
                            <td style={{ padding: "11px 14px", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {customerLabel === "—" ? (
                                <span style={{ color: "#cbd5e1" }}>—</span>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <div style={{
                                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                                    background: "#eff6ff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    <Building2 size={11} color="#3b82f6" />
                                  </div>
                                  <span style={{ fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{customerLabel}</span>
                                </div>
                              )}
                            </td>
  
                            {/* Envoyé par */}
                            <td style={{ padding: "11px 14px", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {userLabel === "—" ? (
                                <span style={{ color: "#cbd5e1" }}>—</span>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <div style={{
                                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                                    background: "#f0fdf4",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    <User size={11} color="#16a34a" />
                                  </div>
                                  <span style={{ fontSize: 12, color: "#475569" }}>{userLabel}</span>
                                </div>
                              )}
                            </td>
  
                            {/* Statut */}
                            <td style={{ padding: "11px 14px" }}>
                              <span style={{
                                background: sc.bg, color: sc.color,
                                padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}>
                                {sc.label}
                              </span>
                            </td>
  
                            {/* Il y a */}
                            <td style={{ padding: "11px 14px", color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>
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
  
            {/* Catégories */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Alertes par catégorie — période</span>
              </div>
              <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {categories.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune donnée</div>
                ) : categories.map((c, i) => (
                  <CatBar key={c.name} name={c.name} value={c.value} max={categories[0].value} color={CAT_COLORS[i] ?? "#3b82f6"} />
                ))}
  
                {/* Résumé audios en bas du panel catégories */}
                {totalAudios > 0 && (
                  <div style={{
                    marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <Music2 size={13} color="#0f766e" />
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      <strong style={{ color: "#1e293b" }}>{totalAudios}</strong> audio{totalAudios > 1 ? "s" : ""} ·{" "}
                      <strong style={{ color: "#1e293b" }}>{categoriesAudio}</strong> catégorie{categoriesAudio > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
  
          {/* ── Activité sirènes ── */}
          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Radio size={14} color="#94a3b8" />
              <span className="panel-title">Sirènes — alertes sur la période</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {sireneActivity.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune sirène</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {["Sirène", "Zone", "Alertes période", "Statut"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sireneActivity.map((s: any) => (
                      <tr
                        key={s.id}
                        style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.12s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}
                      >
                        <td style={{ padding: "11px 16px", fontWeight: 600, color: "#1e293b" }}>{s.name}</td>
                        <td style={{ padding: "11px 16px", color: "#475569" }}>{s.village?.name ?? "—"}</td>
                        <td style={{ padding: "11px 16px", fontWeight: 700, color: "#1a35a0", fontSize: 14 }}>{s.alertCount}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{
                            background: s.isActive ? "#dcfce7" : "#fee2e2",
                            color:       s.isActive ? "#15803d" : "#b91c1c",
                            padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          }}>
                            {s.isActive ? "Active" : "Hors ligne"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
  
        </div>
      </AppLayout>
    );
  }