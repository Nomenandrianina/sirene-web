import { SCHEMES, KEYWORD_MAP } from "./constants";

export type Scheme = {
  card: string; cardSelected: string;
  border: string; borderSelected: string;
  text: string; badgeText: string; badgeBg: string;
  iconBg: string; playerBg: string; checkColor: string;
};

export function getScheme(categorie: any): Scheme {
  if (categorie.color && SCHEMES[categorie.color]) return SCHEMES[categorie.color];
  const n = (categorie.name ?? "").toLowerCase();
  for (const { keywords, color } of KEYWORD_MAP) {
    if (keywords.some(kw => n.includes(kw))) return SCHEMES[color];
  }
  return SCHEMES.neutral;
}