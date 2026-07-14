import { type Scheme } from "./colorHelpers";

export const STEPS = [
  { id: 0, label: "Alertes",        desc: "Choisissez le type d'alerte" },
  { id: 1, label: "Zones",        desc: "Sélectionnez les zones géographiques cibles" },
  { id: 2, label: "Catégorie",    desc: "Choisissez la catégorie et l'audio associé" },
  { id: 3, label: "Confirmation", desc: "Vérifiez et confirmez l'envoi immédiat" },
];

export const SCHEMES: Record<string, Scheme> = {
  green: {
    card: "bg-green-300", cardSelected: "bg-green-400",
    border: "border-green-500", borderSelected: "border-green-700",
    text: "text-green-950", badgeText: "text-green-900", badgeBg: "bg-white/60",
    iconBg: "bg-white/50", playerBg: "bg-white/40", checkColor: "text-green-800",
  },
  yellow: {
    card: "bg-yellow-100", cardSelected: "bg-yellow-200",
    border: "border-yellow-300", borderSelected: "border-yellow-500",
    text: "text-yellow-900", badgeText: "text-yellow-800", badgeBg: "bg-white/60",
    iconBg: "bg-white/50", playerBg: "bg-white/40", checkColor: "text-yellow-600",
  },
  blue: {
    card: "bg-blue-300", cardSelected: "bg-blue-400",
    border: "border-blue-500", borderSelected: "border-blue-700",
    text: "text-blue-950", badgeText: "text-blue-900", badgeBg: "bg-white/60",
    iconBg: "bg-white/50", playerBg: "bg-white/40", checkColor: "text-blue-800",
  },
  red: {
    card: "bg-red-400", cardSelected: "bg-red-500",
    border: "border-red-600", borderSelected: "border-red-800",
    text: "text-white", badgeText: "text-red-100", badgeBg: "bg-white/20",
    iconBg: "bg-white/30", playerBg: "bg-white/20", checkColor: "text-white",
  },
  neutral: {
    card: "bg-slate-50", cardSelected: "bg-slate-100",
    border: "border-slate-200", borderSelected: "border-slate-400",
    text: "text-slate-800", badgeText: "text-slate-600", badgeBg: "bg-slate-200",
    iconBg: "bg-slate-200", playerBg: "bg-slate-200", checkColor: "text-slate-500",
  },
};

export const KEYWORD_MAP = [
  { keywords: ["maitso", "vert",  "green"],         color: "green"  },
  { keywords: ["mavo",   "jaune", "yellow"],         color: "yellow" },
  { keywords: ["manga",  "bleu",  "blue", "violet"], color: "blue"   },
  { keywords: ["mena",   "rouge", "red"],            color: "red"    },
];