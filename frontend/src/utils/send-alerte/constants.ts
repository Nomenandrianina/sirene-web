import { type Scheme } from "./colorHelpers";

export const STEPS = [
  { id: 0, label: "Aléas",        desc: "Choisissez le type d'aléa" },
  { id: 1, label: "Zones",        desc: "Sélectionnez les zones géographiques cibles" },
  { id: 2, label: "Catégorie",    desc: "Choisissez la catégorie et l'audio associé" },
  { id: 3, label: "Confirmation", desc: "Vérifiez et confirmez l'envoi immédiat" },
];

export const SCHEMES: Record<string, Scheme> = {
  green: {
    card: "bg-green-100", cardSelected: "bg-green-200",
    border: "border-green-300", borderSelected: "border-green-500",
    text: "text-green-900", badgeText: "text-green-800", badgeBg: "bg-white/60",
    iconBg: "bg-white/50", playerBg: "bg-white/40", checkColor: "text-green-600",
  },
  yellow: {
    card: "bg-yellow-100", cardSelected: "bg-yellow-200",
    border: "border-yellow-300", borderSelected: "border-yellow-500",
    text: "text-yellow-900", badgeText: "text-yellow-800", badgeBg: "bg-white/60",
    iconBg: "bg-white/50", playerBg: "bg-white/40", checkColor: "text-yellow-600",
  },
  blue: {
    card: "bg-blue-100", cardSelected: "bg-blue-200",
    border: "border-blue-300", borderSelected: "border-blue-500",
    text: "text-blue-900", badgeText: "text-blue-800", badgeBg: "bg-white/60",
    iconBg: "bg-white/50", playerBg: "bg-white/40", checkColor: "text-blue-600",
  },
  red: {
    card: "bg-red-100", cardSelected: "bg-red-200",
    border: "border-red-300", borderSelected: "border-red-500",
    text: "text-red-900", badgeText: "text-red-800", badgeBg: "bg-white/60",
    iconBg: "bg-white/50", playerBg: "bg-white/40", checkColor: "text-red-600",
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