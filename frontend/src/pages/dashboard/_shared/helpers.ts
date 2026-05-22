export const toArr = (r: any): any[] =>
  Array.isArray(r) ? r : r?.response ?? r?.data ?? [];

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "< 1h";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sent:    { label: "Envoyé",     color: "#15803d", bg: "#dcfce7" },
  failed:  { label: "Échoué",     color: "#b91c1c", bg: "#fee2e2" },
  pending: { label: "En attente", color: "#b45309", bg: "#fef3c7" },
};

export const CAT_COLORS        = ["#6366f1", "#3b82f6", "#14b8a6", "#f59e0b", "#ef4444"];
export const CAT_COLORS_CLIENT = ["#ec4899", "#f97316", "#84cc16", "#06b6d4", "#8b5cf6"];