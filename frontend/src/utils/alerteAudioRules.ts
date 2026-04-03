// src/utils/alerteAudioRules.ts

export interface UsedCombination {
    sousCategorieAlerteId: number;
    sireneId: number;
  }
  
  /**
   * Vérifie si une sous-catégorie est totalement bloquée
   * (toutes les sirènes sélectionnées ont déjà cette combinaison)
   */
  export function isSousCatBlocked(
    sousCatId: number,
    sireneIds: number[],
    usedCombinations: UsedCombination[]
  ): boolean {
    if (sireneIds.length === 0) return false;
  
    return sireneIds.every(sireneId =>
      usedCombinations.some(
        c =>
          Number(c.sousCategorieAlerteId) === Number(sousCatId) &&
          Number(c.sireneId) === Number(sireneId)
      )
    );
  }
  
  /**
   * Retourne un label explicatif pour l'utilisateur
   */
  export function getSousCatConflictLabel(
    sousCatId: number,
    sireneIds: number[],
    usedCombinations: UsedCombination[]
  ): string | null {
    if (sireneIds.length === 0) return null;
  
    const conflicting = sireneIds.filter(sireneId =>
      usedCombinations.some(
        c =>
          Number(c.sousCategorieAlerteId) === Number(sousCatId) &&
          Number(c.sireneId) === Number(sireneId)
      )
    );
  
    if (conflicting.length === 0) return null;
  
    if (conflicting.length === sireneIds.length) {
      return " (déjà utilisé)";
    }
  
    return ` (déjà utilisé pour ${conflicting.length}/${sireneIds.length} sirènes)`;
  }