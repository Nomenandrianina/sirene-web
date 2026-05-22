interface BarTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
    vocabEnvois: string;
  }
  
export function BarTooltip({ active, payload, label, vocabEnvois }: BarTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 10, padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        }}>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            {payload[0].value}
            <span style={{ fontSize: 12, fontWeight: 400, color: "#64748b", marginLeft: 4 }}>
            {vocabEnvois}
            </span>
        </div>
        </div>
    );
}