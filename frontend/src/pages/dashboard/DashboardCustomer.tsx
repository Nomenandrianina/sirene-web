import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, AlertTriangle, CheckCircle, TrendingUp, Calendar,} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid,Tooltip, ResponsiveContainer, Cell,} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/services/notification.api";
import { sirenesApi }       from "@/services/sirene.api";
import { AppLayout }        from "@/components/AppLayout";
import { useGreeting }      from "@/hooks/useGreeting";
import { useRole }          from "@/hooks/useRole";
import { StatCard }   from "./_shared/StatCard";
import { CatBar }     from "./_shared/CatBar";
import { SeeAllBtn }  from "./_shared/SeeAllBtn";
import { BarTooltip } from "./_shared/BarTooltip";
import { toArr, relativeTime, STATUS_CONFIG, CAT_COLORS_CLIENT } from "./_shared/helpers";
import "@/styles/page.css";


// customerId peut être string | number | undefined selon le contexte
function safeId(id: any): number | undefined {
  return id != null && !Number.isNaN(Number(id)) ? Number(id) : undefined;
}

export default function DashboardCustomer() {
  const navigate = useNavigate();
  const { customerId } = useRole();
  const { greeting, firstName, period } = useGreeting();

  const cid = safeId(customerId);

  const today      = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const defStart   = monthStart.toISOString().slice(0, 10);
  const defEnd     = today.toISOString().slice(0, 10);

  const [filterStart, setFilterStart] = useState(defStart);
  const [filterEnd,   setFilterEnd]   = useState(defEnd);
  const [applied,     setApplied]     = useState({ start: defStart, end: defEnd });

  const enabled = cid !== undefined;

  // ── Queries ──────────────────────────────────────────────────────────────

  // Toutes les diffusions du client (sans filtre date) → compteurs today / mois
  const { data: rawAll } = useQuery({
    queryKey: ["customer-notifs-all", cid],
    queryFn:  () => notificationsApi.getAll({ limit: 2000, customerId: cid }),
    enabled,
  });

  // Diffusions filtrées par période → graphique, liste, catégories
  const { data: rawFiltered } = useQuery({
    queryKey: ["customer-notifs-filtered", applied, cid],
    queryFn:  () => notificationsApi.getAll({
      limit: 500, startDate: applied.start, endDate: applied.end, customerId: cid,
    }),
    enabled,
  });

  // Stats agrégées sur la période
  const { data: rawStats } = useQuery({
    queryKey: ["customer-stats", applied, cid],
    queryFn:  () => notificationsApi.getStats({
      startDate: applied.start, endDate: applied.end, customerId: cid,
    }),
    enabled,
  });

  const { data: rawSirenes } = useQuery({
    queryKey: ["sirenes"],
    queryFn:  () => sirenesApi.getAll(),
  });

  // ── Normalisation ─────────────────────────────────────────────────────────

  const notifsAll      = useMemo(() => toArr(rawAll),      [rawAll]);
  const notifsFiltered = useMemo(() => toArr(rawFiltered), [rawFiltered]);
  const sirenes        = useMemo(() => toArr(rawSirenes),  [rawSirenes]);
  const stats          = rawStats as any;

  // Filtrer les sirènes liées au client uniquement
  const clientSirenes = useMemo(() =>
    sirenes.filter((s: any) => s.customers?.some((sc: any) => sc.id === cid)),
  [sirenes, cid]);

  // ── Calculs ───────────────────────────────────────────────────────────────

  const totalSirenes    = clientSirenes.length;
  const activeSirenes   = clientSirenes.filter((s: any) => s.isActive).length;
  const inactiveSirenes = totalSirenes - activeSirenes;

  const totalSent   = stats?.sent   ?? notifsFiltered.filter((n: any) => n.status === "sent").length;
  const totalFailed = stats?.failed ?? notifsFiltered.filter((n: any) => n.status === "failed").length;
  const totalNotifs = stats?.total  ?? notifsFiltered.length;
  const successRate = totalNotifs > 0
    ? Math.round((totalSent / (totalSent + totalFailed || 1)) * 1000) / 10
    : 0;

  const todayStart     = new Date(); todayStart.setHours(0, 0, 0, 0);
  const mStart         = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(mStart);

  const diffusionsToday = useMemo(() =>
    notifsAll.filter((n: any) =>
      n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= todayStart
    ).length,
  [notifsAll]);

  const diffusionsMonth = useMemo(() =>
    notifsAll.filter((n: any) =>
      n.status === "sent" && new Date(n.sendingTime ?? n.createdAt) >= mStart
    ).length,
  [notifsAll]);

  const diffusionsLastMonth = useMemo(() =>
    notifsAll.filter((n: any) =>
      n.status === "sent" &&
      new Date(n.sendingTime ?? n.createdAt) >= lastMonthStart &&
      new Date(n.sendingTime ?? n.createdAt) <  lastMonthEnd
    ).length,
  [notifsAll]);

  const monthDelta = diffusionsLastMonth > 0
    ? Math.round(((diffusionsMonth - diffusionsLastMonth) / diffusionsLastMonth) * 100)
    : null;

  // ── Graphique ─────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    const start    = new Date(applied.start + "T00:00:00");
    const end      = new Date(applied.end   + "T23:59:59");
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const nDays    = Math.min(diffDays + 1, 60);
    const days = Array.from({ length: nDays }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0);
      return { date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), ts: d.getTime(), count: 0 };
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
      const cat = n.sousCategorieAlerte?.name ?? n.categorieAlerte?.name ?? "Autre";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [notifsFiltered]);

  // ── Activité sirènes du client ────────────────────────────────────────────

  const sireneActivity = useMemo(() =>
    clientSirenes
      .map((s: any) => ({
        ...s,
        alertCount: notifsFiltered.filter((n: any) => n.status === "sent" && n.sireneId === s.id).length,
      }))
      .sort((a: any, b: any) => b.alertCount - a.alertCount)
      .slice(0, 5),
  [clientSirenes, notifsFiltered]);

  // ── Dernières diffusions ──────────────────────────────────────────────────

  const lastNotifs = useMemo(() =>
    [...notifsFiltered]
      .filter((n: any) => n.sendingTime || n.createdAt)
      .sort((a: any, b: any) =>
        new Date(b.sendingTime ?? b.createdAt).getTime() -
        new Date(a.sendingTime ?? a.createdAt).getTime()
      )
      .slice(0, 6),
  [notifsFiltered]);

  // ─────────────────────────────────────────────────────────────────────────

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
            <p className="page-subtitle">Tableau de bord de votre compte</p>
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

        {/* ── Row 1 : 4 stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 14 }}>
          <StatCard
            title="Sirènes actives"
            value={`${activeSirenes}/${totalSirenes}`}
            sub={inactiveSirenes > 0 ? `${inactiveSirenes} hors ligne` : "Toutes opérationnelles"}
            icon={Radio} color="green"
          />
          <StatCard
            title="Diffusions aujourd'hui"
            value={diffusionsToday}
            sub="Voir le détail"
            icon={AlertTriangle} color="amber"
            onClick={() => navigate("/notifications")}
          />
          <StatCard
            title="Diffusions — mois en cours"
            value={diffusionsMonth}
            sub={monthDelta !== null
              ? `${monthDelta >= 0 ? "▲" : "▼"} ${Math.abs(monthDelta)}% vs mois dernier`
              : "Mois en cours"}
            icon={TrendingUp} color="navy"
            onClick={() => navigate("/notifications")}
          />
          <StatCard
            title="Taux de succès"
            value={`${successRate}%`}
            sub={`${totalFailed} échec${totalFailed > 1 ? "s" : ""} · ${totalNotifs} total`}
            icon={CheckCircle}
            color={successRate >= 95 ? "green" : successRate >= 80 ? "amber" : "red"}
          />
        </div>

        {/* ── Graphique ── */}
        <div style={{ marginBottom: 24 }}>
          <div className="panel">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="panel-title">
                Diffusions envoyées —{" "}
                {applied.start === applied.end
                  ? new Date(applied.start).toLocaleDateString("fr-FR")
                  : `${new Date(applied.start).toLocaleDateString("fr-FR")} → ${new Date(applied.end).toLocaleDateString("fr-FR")}`}
              </span>
              <SeeAllBtn onClick={() => navigate("/notifications")} />
            </div>
            <div className="panel-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip content={<BarTooltip vocabEnvois="diffusions" />} cursor={{ fill: "rgba(0,0,0,0.02)", radius: 6 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={i === chartData.length - 1 ? "#7c3aed" : "#ede9fe"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── Liste + catégories ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginBottom: 24 }}>

          {/* Tableau dernières diffusions */}
          <div className="panel">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="panel-title">Dernières diffusions</span>
              <SeeAllBtn onClick={() => navigate("/notifications")} />
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {lastNotifs.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune diffusion</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {["Sirène", "Catégorie", "Zone", "Statut", "Date envoi", "Il y a"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lastNotifs.map((n: any) => {
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

          {/* Catégories */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Diffusions par catégorie — période</span>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {categories.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune donnée</div>
              ) : categories.map((c, i) => (
                <CatBar key={c.name} name={c.name} value={c.value} max={categories[0].value} color={CAT_COLORS_CLIENT[i] ?? "#ec4899"} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Activité sirènes ── */}
        <div className="panel" style={{ marginBottom: 24 }}>
          <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Radio size={14} color="#94a3b8" />
            <span className="panel-title">Vos sirènes — diffusions sur la période</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {sireneActivity.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune sirène</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {["Sirène", "Zone", "Diffusions période", "Statut"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sireneActivity.map((s: any) => (
                    <tr key={s.id}
                      style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.12s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "11px 16px", fontWeight: 600, color: "#1e293b" }}>{s.name}</td>
                      <td style={{ padding: "11px 16px", color: "#475569" }}>{s.village?.name ?? "—"}</td>
                      <td style={{ padding: "11px 16px", fontWeight: 700, color: "#7c3aed", fontSize: 14 }}>{s.alertCount}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{
                          background: s.isActive ? "#dcfce7" : "#fee2e2",
                          color: s.isActive ? "#15803d" : "#b91c1c",
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