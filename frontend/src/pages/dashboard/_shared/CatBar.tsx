interface CatBarProps {
    name: string;
    value: number;
    max: number;
    color: string;
  }
  
  export function CatBar({ name, value, max, color }: CatBarProps) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{name}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}</span>
        </div>
        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.round((value / max) * 100)}%`,
            background: color,
            borderRadius: 3,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>
    );
  }