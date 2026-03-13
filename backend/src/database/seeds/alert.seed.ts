import { DataSource } from "typeorm";
import { Alerte } from "@/alerte/entities/alerte.entity";
import { AlerteType } from "@/alerte-type/entities/alerte-type.entity";
import { CategorieAlerte } from "@/categorie-alerte/entities/categorie-alerte.entity";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";

export async function seedAlertes(dataSource: DataSource) {
  const alerteRepo    = dataSource.getRepository(Alerte);
  const typeRepo      = dataSource.getRepository(AlerteType);
  const catRepo       = dataSource.getRepository(CategorieAlerte);
  const sousCatRepo   = dataSource.getRepository(SousCategorieAlerte);

  // Éviter double seed
  const existing = await alerteRepo.count();
  if (existing > 0) {
    console.log("Alertes déjà seedées — skip");
    return;
  }

  console.log("Seeding alertes...");

  // ══════════════════════════════════════════════════════════════════
  // 1. ALERTES PRINCIPALES
  // ══════════════════════════════════════════════════════════════════
  const aCatastrophe   = await alerteRepo.save(alerteRepo.create({ name: "Catastrophe naturelle" }));
  const aSensibilisation = await alerteRepo.save(alerteRepo.create({ name: "Sensibilisation / Communication" }));
  const aAutomatique   = await alerteRepo.save(alerteRepo.create({ name: "Alerte automatique" }));

  // ══════════════════════════════════════════════════════════════════
  // 2. ALERTE TYPES — Catastrophe naturelle
  // ══════════════════════════════════════════════════════════════════
  const tCyclone   = await typeRepo.save(typeRepo.create({ name: "Cyclone",               alerteId: aCatastrophe.id }));
  const tInondation= await typeRepo.save(typeRepo.create({ name: "Inondation",            alerteId: aCatastrophe.id }));
  const tEboulement= await typeRepo.save(typeRepo.create({ name: "Éboulement",            alerteId: aCatastrophe.id }));
  const tIncendie  = await typeRepo.save(typeRepo.create({ name: "Incendie / Feux de brousse", alerteId: aCatastrophe.id }));

  // Alerte Types — Sensibilisation / Communication
  const tSensib    = await typeRepo.save(typeRepo.create({ name: "Sensibilisation",       alerteId: aSensibilisation.id }));
  const tRenseign  = await typeRepo.save(typeRepo.create({ name: "Renseignement",         alerteId: aSensibilisation.id }));
  const tAnnonce   = await typeRepo.save(typeRepo.create({ name: "Annonce",               alerteId: aSensibilisation.id }));
  const tPublicite = await typeRepo.save(typeRepo.create({ name: "Publicité",             alerteId: aSensibilisation.id }));

  // Alerte Types — Alerte automatique
  const tVentFort  = await typeRepo.save(typeRepo.create({ name: "Vent fort",             alerteId: aAutomatique.id }));
  const tVague     = await typeRepo.save(typeRepo.create({ name: "Montée de vague",       alerteId: aAutomatique.id }));
  const tPluie     = await typeRepo.save(typeRepo.create({ name: "Forte pluie",           alerteId: aAutomatique.id }));

  // ══════════════════════════════════════════════════════════════════
  // 3. CATÉGORIES + SOUS-CATÉGORIES — CYCLONE
  // ══════════════════════════════════════════════════════════════════
  const jours = ["5 jours avant DANGER","4 jours avant DANGER","3 jours avant DANGER","2 jours avant DANGER","1 jour avant DANGER"];

  // Cyclone — Temps estimé d'impact
  const cCycTemps = await catRepo.save(catRepo.create({ name: "Temps estimé d'impact", alerteTypeId: tCyclone.id }));
  for (const j of jours) {
    await sousCatRepo.save(sousCatRepo.create({ name: j, categorieAlerteId: cCycTemps.id, alerteId: aCatastrophe.id, alerteTypeId: tCyclone.id }));
  }

  // Cyclone — Entrée de l'œil
  const cCycOeil = await catRepo.save(catRepo.create({ name: "Entrée de l'œil du cyclone", alerteTypeId: tCyclone.id }));
  for (const j of jours) {
    await sousCatRepo.save(sousCatRepo.create({ name: j, categorieAlerteId: cCycOeil.id, alerteId: aCatastrophe.id, alerteTypeId: tCyclone.id }));
  }

  // Cyclone — Classification des systèmes cycloniques
  const cCycClass = await catRepo.save(catRepo.create({ name: "Classification des systèmes cycloniques", alerteTypeId: tCyclone.id }));
  for (const sc of [
    "(DT) Vent : 51 à 62 km/h",
    "(TTM) Vent : 63 à 88 km/h",
    "(FTT) Vent : 89 à 117 km/h",
    "(CT) Vent : 118 à 165 km/h",
    "(CTI) Vent : 166 à 212 km/h",
    "(CTTI) Vent : > 212 km/h",
  ]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cCycClass.id, alerteId: aCatastrophe.id, alerteTypeId: tCyclone.id }));
  }

  // Cyclone — Classement des codes couleurs
  const cCycCouleur = await catRepo.save(catRepo.create({ name: "Classement des codes couleurs", alerteTypeId: tCyclone.id }));
  for (const sc of [
    "(Vert) FILAZANA FANAIRANA — 2 à 5 jours avant DANGER",
    "(Jaune) FILAZANA LOZA MANAMBANA — 1 ou 2 jours avant DANGER",
    "(Rouge) FILAZANA LOZA MITATAO — Dans le DANGER",
    "(Bleu) FILAZANA FAHAMAILONA",
  ]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cCycCouleur.id, alerteId: aCatastrophe.id, alerteTypeId: tCyclone.id }));
  }

  // Cyclone — Sensibilisation par codes couleurs
  const cCycSensib = await catRepo.save(catRepo.create({ name: "Sensibilisation par codes couleurs", alerteTypeId: tCyclone.id }));
  for (const sc of ["(Vert)", "(Jaune)", "(Rouge)", "(Bleu)"]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cCycSensib.id, alerteId: aCatastrophe.id, alerteTypeId: tCyclone.id }));
  }

  // Cyclone — Fin d'alerte
  const cCycFin = await catRepo.save(catRepo.create({ name: "Fin d'alerte", alerteTypeId: tCyclone.id }));
  await sousCatRepo.save(sousCatRepo.create({ name: "Message fin d'alerte", categorieAlerteId: cCycFin.id, alerteId: aCatastrophe.id, alerteTypeId: tCyclone.id }));

  // ══════════════════════════════════════════════════════════════════
  // 4. INONDATION
  // ══════════════════════════════════════════════════════════════════

  const cInoTemps = await catRepo.save(catRepo.create({ name: "Temps estimé d'impact", alerteTypeId: tInondation.id }));
  for (const j of jours) {
    await sousCatRepo.save(sousCatRepo.create({ name: j, categorieAlerteId: cInoTemps.id, alerteId: aCatastrophe.id, alerteTypeId: tInondation.id }));
  }

  const cInoZone = await catRepo.save(catRepo.create({ name: "Zone impactée de l'inondation", alerteTypeId: tInondation.id }));
  for (const j of jours) {
    await sousCatRepo.save(sousCatRepo.create({ name: j, categorieAlerteId: cInoZone.id, alerteId: aCatastrophe.id, alerteTypeId: tInondation.id }));
  }

  const cInoFleuve = await catRepo.save(catRepo.create({ name: "Classement des montées de fleuves par zone", alerteTypeId: tInondation.id }));
  for (const sc of [
    "Renirano Sisaony",
    "Renirano Ikopa",
    "Renirano Mamba",
    "Renirano Betsiboka",
    "Renirano Mahajamba",
    "Renirano Tsiribihina",
  ]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cInoFleuve.id, alerteId: aCatastrophe.id, alerteTypeId: tInondation.id }));
  }

  const cInoCouleur = await catRepo.save(catRepo.create({ name: "Classement des codes couleurs", alerteTypeId: tInondation.id }));
  for (const sc of [
    "(Vert) FILAZANA FANAIRANA — 2 à 5 jours avant DANGER",
    "(Jaune) FILAZANA LOZA MANAMBANA — 1 ou 2 jours avant DANGER",
    "(Rouge) FILAZANA LOZA MITATAO — Dans le DANGER",
    "(Bleu) FILAZANA FAHAMAILONA",
  ]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cInoCouleur.id, alerteId: aCatastrophe.id, alerteTypeId: tInondation.id }));
  }

  const cInoSensib = await catRepo.save(catRepo.create({ name: "Sensibilisation par codes couleurs", alerteTypeId: tInondation.id }));
  for (const sc of ["(Vert)", "(Jaune)", "(Rouge)", "(Bleu)"]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cInoSensib.id, alerteId: aCatastrophe.id, alerteTypeId: tInondation.id }));
  }

  // ══════════════════════════════════════════════════════════════════
  // 5. ÉBOULEMENT
  // ══════════════════════════════════════════════════════════════════

  const cEboTemps = await catRepo.save(catRepo.create({ name: "Temps estimé d'impact", alerteTypeId: tEboulement.id }));
  for (const j of jours) {
    await sousCatRepo.save(sousCatRepo.create({ name: j, categorieAlerteId: cEboTemps.id, alerteId: aCatastrophe.id, alerteTypeId: tEboulement.id }));
  }

  const cEboZone = await catRepo.save(catRepo.create({ name: "Zone impactée de l'éboulement", alerteTypeId: tEboulement.id }));
  for (const j of jours) {
    await sousCatRepo.save(sousCatRepo.create({ name: j, categorieAlerteId: cEboZone.id, alerteId: aCatastrophe.id, alerteTypeId: tEboulement.id }));
  }

  const cEboPierre = await catRepo.save(catRepo.create({ name: "Classement des pierres dangereuses par zone", alerteTypeId: tEboulement.id }));
  for (const sc of ["Vato Ankatso", "Vato Ambatomaro", "Vato Ankadilalana"]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cEboPierre.id, alerteId: aCatastrophe.id, alerteTypeId: tEboulement.id }));
  }

  const cEboCouleur = await catRepo.save(catRepo.create({ name: "Classement des codes couleurs", alerteTypeId: tEboulement.id }));
  for (const sc of [
    "(Vert) FILAZANA FANAIRANA — 2 à 5 jours avant DANGER",
    "(Jaune) FILAZANA LOZA MANAMBANA — 1 ou 2 jours avant DANGER",
    "(Rouge) FILAZANA LOZA MITATAO — Dans le DANGER",
    "(Bleu) FILAZANA FAHAMAILONA",
  ]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cEboCouleur.id, alerteId: aCatastrophe.id, alerteTypeId: tEboulement.id }));
  }

  const cEboSensib = await catRepo.save(catRepo.create({ name: "Sensibilisation par codes couleurs", alerteTypeId: tEboulement.id }));
  for (const sc of ["(Vert)", "(Jaune)", "(Rouge)", "(Bleu)"]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cEboSensib.id, alerteId: aCatastrophe.id, alerteTypeId: tEboulement.id }));
  }

  const cEboFin = await catRepo.save(catRepo.create({ name: "Fin d'alerte", alerteTypeId: tEboulement.id }));
  await sousCatRepo.save(sousCatRepo.create({ name: "Message fin d'alerte", categorieAlerteId: cEboFin.id, alerteId: aCatastrophe.id, alerteTypeId: tEboulement.id }));

  // ══════════════════════════════════════════════════════════════════
  // 6. INCENDIE / FEUX DE BROUSSE
  // ══════════════════════════════════════════════════════════════════

  const cIncTemps = await catRepo.save(catRepo.create({ name: "Temps estimé d'impact", alerteTypeId: tIncendie.id }));
  for (const j of jours) {
    await sousCatRepo.save(sousCatRepo.create({ name: j, categorieAlerteId: cIncTemps.id, alerteId: aCatastrophe.id, alerteTypeId: tIncendie.id }));
  }

  const cIncZone = await catRepo.save(catRepo.create({ name: "Zone impactée des feux", alerteTypeId: tIncendie.id }));
  for (const j of jours) {
    await sousCatRepo.save(sousCatRepo.create({ name: j, categorieAlerteId: cIncZone.id, alerteId: aCatastrophe.id, alerteTypeId: tIncendie.id }));
  }

  const cIncFeux = await catRepo.save(catRepo.create({ name: "Classement des feux par zone", alerteTypeId: tIncendie.id }));
  for (const sc of ["Ankazobe", "Allée des Baobabs", "Petite vitesse"]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cIncFeux.id, alerteId: aCatastrophe.id, alerteTypeId: tIncendie.id }));
  }

  const cIncCouleur = await catRepo.save(catRepo.create({ name: "Classement des codes couleurs", alerteTypeId: tIncendie.id }));
  for (const sc of [
    "(Vert) FILAZANA FANAIRANA — 2 à 5 jours avant DANGER",
    "(Jaune) FILAZANA LOZA MANAMBANA — 1 ou 2 jours avant DANGER",
    "(Rouge) FILAZANA LOZA MITATAO — Dans le DANGER",
    "(Bleu) FILAZANA FAHAMAILONA",
  ]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cIncCouleur.id, alerteId: aCatastrophe.id, alerteTypeId: tIncendie.id }));
  }

  const cIncSensib = await catRepo.save(catRepo.create({ name: "Sensibilisation par codes couleurs", alerteTypeId: tIncendie.id }));
  for (const sc of ["(Vert)", "(Jaune)", "(Rouge)", "(Bleu)"]) {
    await sousCatRepo.save(sousCatRepo.create({ name: sc, categorieAlerteId: cIncSensib.id, alerteId: aCatastrophe.id, alerteTypeId: tIncendie.id }));
  }

  const cIncFin = await catRepo.save(catRepo.create({ name: "Fin d'alerte", alerteTypeId: tIncendie.id }));
  await sousCatRepo.save(sousCatRepo.create({ name: "Message fin d'alerte", categorieAlerteId: cIncFin.id, alerteId: aCatastrophe.id, alerteTypeId: tIncendie.id }));

  // ══════════════════════════════════════════════════════════════════
  // 7. SENSIBILISATION / COMMUNICATION (4 types → 1 catégorie chacun)
  // ══════════════════════════════════════════════════════════════════
  for (const t of [tSensib, tRenseign, tAnnonce, tPublicite]) {
    const cat = await catRepo.save(catRepo.create({ name: "Type de communication", alerteTypeId: t.id }));
    await sousCatRepo.save(sousCatRepo.create({ name: "Audio", categorieAlerteId: cat.id, alerteId: aSensibilisation.id, alerteTypeId: t.id }));
    await sousCatRepo.save(sousCatRepo.create({ name: "SMS",   categorieAlerteId: cat.id, alerteId: aSensibilisation.id, alerteTypeId: t.id }));
    await sousCatRepo.save(sousCatRepo.create({ name: "Notification push", categorieAlerteId: cat.id, alerteId: aSensibilisation.id, alerteTypeId: t.id }));
  }

  // ══════════════════════════════════════════════════════════════════
  // 8. ALERTE AUTOMATIQUE (3 types → catégorie + niveaux)
  // ══════════════════════════════════════════════════════════════════
  for (const [t, niveaux] of [
    [tVentFort, ["Niveau 1 — Modéré", "Niveau 2 — Fort", "Niveau 3 — Très fort", "Niveau 4 — Extrême"]],
    [tVague,    ["Niveau 1 — Faible", "Niveau 2 — Modérée", "Niveau 3 — Forte", "Niveau 4 — Très forte"]],
    [tPluie,    ["Niveau 1 — Pluie légère", "Niveau 2 — Pluie modérée", "Niveau 3 — Pluie forte", "Niveau 4 — Pluie torrentielle"]],
  ] as [any, string[]][]) {
    const cat = await catRepo.save(catRepo.create({ name: "Niveau d'intensité", alerteTypeId: t.id }));
    for (const n of niveaux) {
      await sousCatRepo.save(sousCatRepo.create({ name: n, categorieAlerteId: cat.id, alerteId: aAutomatique.id, alerteTypeId: t.id }));
    }
  }

  console.log("Seed alertes terminé ✓");
  console.log(`  3 Alertes | 11 Types | Catégories et sous-catégories créées`);
}