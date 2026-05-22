import { ArrowRight } from "lucide-react";

const PALETTES = {
  green:  { grad: "linear-gradient(135deg,#16a34a 0%,#22c55e 100%)", sub: "rgba(255,255,255,0.78)", text: "#fff" },
  amber:  { grad: "linear-gradient(135deg,#d97706 0%,#f59e0b 100%)", sub: "rgba(255,255,255,0.78)", text: "#fff" },
  navy:   { grad: "linear-gradient(135deg,#1a35a0 0%,#3b82f6 100%)", sub: "rgba(255,255,255,0.78)", text: "#fff" },
  red:    { grad: "linear-gradient(135deg,#dc2626 0%,#ef4444 100%)", sub: "rgba(255,255,255,0.78)", text: "#fff" },
  teal:   { grad: "linear-gradient(135deg,#0f766e 0%,#14b8a6 100%)", sub: "rgba(255,255,255,0.78)", text: "#fff" },
  slate:  { grad: "linear-gradient(135deg,#334155 0%,#64748b 100%)", sub: "rgba(255,255,255,0.78)", text: "#fff" },
  blue:   { grad: "linear-gradient(135deg,#1d4ed8 0%,#60a5fa 100%)", sub: "rgba(255,255,255,0.78)", text: "#fff" },
  purple: { grad: "linear-gradient(135deg,#7c3aed 0%,#a78bfa 100%)", sub: "rgba(255,255,255,0.78)", text: "#fff" },
} as const;

export type PaletteKey = keyof typeof PALETTES;

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ElementType;
  color: PaletteKey;
  onClick?: () => void;
}

export function StatCard({ title, value, sub, icon: Icon, color, onClick }: StatCardProps) {
  const p = PALETTES[color];
  return (
    <div
      onClick={onClick}
      style={{
        background: p.grad, borderRadius: 16, padding: "20px 22px",
        position: "relative", overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.15s, box-shadow 0.15s",
        boxShadow: "0 2px 14px rgba(0,0,0,0.12)",
      }}
      onMouseEnter={e => {
        if (!onClick) return;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.20)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 14px rgba(0,0,0,0.12)";
      }}
    >
      <div style={{ position: "absolute", right: -20, top: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.10)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 18, bottom: -30, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, position: "relative" }}>
        <span style={{ fontSize: 13, color: p.sub, fontWeight: 500 }}>{title}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={p.text} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: p.text, lineHeight: 1, marginBottom: 6, position: "relative" }}>{value}</div>
      <div style={{ fontSize: 12, color: p.sub, position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
        {sub}{onClick && <ArrowRight size={11} />}
      </div>
    </div>
  );
}