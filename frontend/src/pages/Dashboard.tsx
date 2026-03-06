import { Radio, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import "../styles/page.css";

const mockStats = {
  totalSirenes: 156,
  activeSirenes: 142,
  alertesToday: 8,
  alertesMonth: 234,
  successRate: 97.3,
};

const mockChart = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit",
  }),
  count: Math.floor(Math.random() * 20) + 5,
}));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e8eaed",
      borderRadius: 10,
      padding: "10px 16px",
      fontFamily: "'DM Sans', sans-serif",
      boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontSize: "0.75rem", color: "#9aa0a6", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f5c518", fontFamily: "'Syne', sans-serif" }}>
        {payload[0].value}
        <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "rgba(232,238,255,0.5)", marginLeft: 4 }}>alertes</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.getDashboardStats(),
    placeholderData: mockStats,
  });

  const { data: chartData } = useQuery({
    queryKey: ["dashboard-chart"],
    queryFn: () => api.getAlertesChart(14),
    placeholderData: mockChart,
  });

  const cards = [
    { title: "Sirènes actives",     value: `${stats?.activeSirenes ?? 0}/${stats?.totalSirenes ?? 0}`, icon: Radio,         color: "green",  trend: "Sur le réseau national" },
    { title: "Alertes aujourd'hui", value: stats?.alertesToday ?? 0,                                   icon: AlertTriangle, color: "gold",   trend: "Depuis minuit" },
    { title: "Alertes ce mois",     value: stats?.alertesMonth ?? 0,                                   icon: TrendingUp,    color: "sky",    trend: "30 derniers jours" },
    { title: "Taux de succès",      value: `${stats?.successRate ?? 0}%`,                              icon: CheckCircle,   color: "purple", trend: "Livraison confirmée" },
  ];

  return (
    <AppLayout>
      <div className="page-wrap">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Vue d'ensemble du système d'alertes</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="stats-grid">
          {cards.map((card) => (
            <div className={`stat-card ${card.color}`} key={card.title}>
              <div className="stat-card-bg-orb" />
              <div className="stat-card-top">
                <span className="stat-card-label">{card.title}</span>
                <div className="stat-card-icon">
                  <card.icon size={16} />
                </div>
              </div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-trend">{card.trend}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Alertes envoyées — 14 derniers jours</span>
          </div>
          <div className="panel-body">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9aa0a6", fontSize: 11, fontFamily: "'DM Sans'" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9aa0a6", fontSize: 11, fontFamily: "'DM Sans'" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)", radius: 6 }} />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    fill="url(#barGrad)"
                  />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#1a35a0" stopOpacity={1} />
                      <stop offset="100%" stopColor="#2347c2" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
