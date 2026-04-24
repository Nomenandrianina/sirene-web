import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";

export function useGreeting() {
  const { user } = useAuth();
  const { isSuperAdmin, isClient } = useRole();

  return useMemo(() => {
    const hour = new Date().getHours();

    const period =
      hour >= 5  && hour < 12 ? "matin"   :
      hour >= 12 && hour < 18 ? "journée" :
      hour >= 18 && hour < 22 ? "soir"    : "nuit";

    const salutations: Record<string, Record<string, string>> = {
      matin:   {
        superadmin: "Bonjour",
        client:     "Bonjour",
        default:    "Bonjour",
      },
      journée: {
        superadmin: "Bon après-midi",
        client:     "Bon après-midi",
        default:    "Bon après-midi",
      },
      soir: {
        superadmin: "Bonsoir",
        client:     "Bonsoir",
        default:    "Bonsoir",
      },
      nuit: {
        superadmin: "Bonne nuit",
        client:     "Bonne nuit",
        default:    "Bonne nuit",
      },
    };

    const roleKey = isSuperAdmin ? "superadmin" : isClient ? "client" : "default";
    const greeting = salutations[period][roleKey];

    const sublines: Record<string, Record<string, string>> = {
      matin:   {
        superadmin: "Voici l'état global du système ce matin.",
        client:     "Vos sirènes sont opérationnelles.",
        default:    "Bienvenue sur votre tableau de bord.",
      },
      journée: {
        superadmin: "Activité en cours sur le réseau.",
        client:     "Suivi en temps réel de vos alertes.",
        default:    "Vue d'ensemble du système.",
      },
      soir: {
        superadmin: "Récapitulatif de la journée.",
        client:     "Résumé des alertes de la journée.",
        default:    "Bilan de la journée.",
      },
      nuit: {
        superadmin: "Surveillance nocturne active.",
        client:     "Le système veille pour vous.",
        default:    "Système en veille.",
      },
    };

    const firstName = user?.first_name ?? user?.last_name?.split(" ")[0] ?? "";
    const sub = sublines[period][roleKey];

    return { greeting, firstName, sub, period };
  }, [user, isSuperAdmin, isClient]);
}