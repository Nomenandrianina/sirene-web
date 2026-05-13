import {
    Wind, Waves, Zap, Flame, Thermometer,
    CloudRain, Mountain, Bug, AlertTriangle,
  } from "lucide-react";
  import type { ElementType } from "react";
  
  export function toMadagascarTime(date: Date): string {
    return date.toLocaleTimeString("fr-FR", {
      timeZone: "Indian/Antananarivo",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  }
  
  export function getTypeIconComponent(typeName = ""): ElementType {
    const n = typeName.toLowerCase();
    if (n.includes("cyclone"))                           return Wind;
    if (n.includes("inond") || n.includes("crue"))       return Waves;
    if (n.includes("séisme") || n.includes("tremblem"))  return Zap;
    if (n.includes("feu") || n.includes("incendie"))     return Flame;
    if (n.includes("sécheresse") || n.includes("aride")) return Thermometer;
    if (n.includes("pluie") || n.includes("forte"))      return CloudRain;
    if (n.includes("glissement") || n.includes("éboul")) return Mountain;
    if (n.includes("acridien") || n.includes("criquet")) return Bug;
    return AlertTriangle;
  }
  
  export function getTypeEmoji(typeName = ""): string {
    const n = typeName.toLowerCase();
    if (n.includes("cyclone"))                           return "🌀";
    if (n.includes("inond") || n.includes("crue"))       return "🌊";
    if (n.includes("séisme") || n.includes("tremblem"))  return "⚡";
    if (n.includes("feu") || n.includes("incendie"))     return "🔥";
    if (n.includes("sécheresse") || n.includes("aride")) return "☀️";
    if (n.includes("pluie") || n.includes("forte"))      return "🌧️";
    if (n.includes("glissement") || n.includes("éboul")) return "⛰️";
    if (n.includes("acridien") || n.includes("criquet")) return "🦗";
    return "⚠️";
  }