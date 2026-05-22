import { ArrowRight } from "lucide-react";

interface SeeAllBtnProps {
  onClick: () => void;
  label?: string;
}

export function SeeAllBtn({ onClick, label = "Voir tout" }: SeeAllBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: 12, color: "#1a35a0", fontWeight: 600,
        background: "#eff6ff", border: "none", borderRadius: 8,
        padding: "5px 12px", cursor: "pointer",
      }}
    >
      {label} <ArrowRight size={12} />
    </button>
  );
}