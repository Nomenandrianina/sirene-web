import { DataSource } from 'typeorm';

// ── Seed PackType ─────────────────────────────────────────────────────────────
export async function seedPackTypes(dataSource: DataSource) {
  const existing = await dataSource.query(
    'SELECT COUNT(*) as cnt FROM pack_type',
  );
  if (parseInt(existing[0].cnt) > 0) {
    console.log('PackTypes déjà seedés — skip');
    return;
  }

  await dataSource.query(`
    INSERT INTO pack_type
      (name, description, frequence_par_jour, jours_par_semaine, jours_autorises, duree_max_minutes, prix, periode, is_active)
    VALUES
      (
        'premium',
        '3 diffusions par jour tous les jours — créneaux 7h, 12h et 16h',
        3, 7, NULL, 20, 150000, 'monthly', 1
      ),
      (
        'medium',
        '1 diffusion par jour tous les jours — créneau 7h uniquement',
        1, 7, NULL, 20, 75000, 'monthly', 1
      ),
      (
        'basique',
        '3 diffusions par semaine — lundi, mercredi, vendredi à 7h',
        1, 3, '1,3,5', 15, 30000, 'monthly', 1
      )
  `);

  console.log('✅ PackTypes seedés (3 packs : premium, medium, basique)');
}

// ── Seed Permissions pour le module Diffusion ────────────────────────────────
export async function seedDiffusionPermissions(dataSource: DataSource) {
  const permissionsToSeed = [
    // PackType
    'pack-types:read',
    'pack-types:create',
    'pack-types:update',
    'pack-types:delete',

    // Souscription
    'souscriptions:read',
    'souscriptions:read-own',   // client : voir ses propres souscriptions
    'souscriptions:create',
    'souscriptions:update',
    'souscriptions:suspend',
    'souscriptions:reactivate',
    'souscriptions:delete',

    // DiffusionLog
    'diffusion-logs:read',
    'diffusion-logs:read-own',  // client : voir ses propres logs
  ];

  let inserted = 0;
  for (const name of permissionsToSeed) {
    const exists = await dataSource.query(
      'SELECT COUNT(*) as cnt FROM permissions WHERE name = ?',
      [name],
    );
    if (parseInt(exists[0].cnt) === 0) {
      await dataSource.query('INSERT INTO permissions (name) VALUES (?)', [name]);
      inserted++;
    }
  }

  if (inserted === 0) {
    console.log('Permissions diffusion déjà seedées — skip');
  } else {
    console.log(`✅ Permissions diffusion seedées (${inserted} permissions)`);
  }
}

// ── Point d'entrée combiné ────────────────────────────────────────────────────
export async function seedDiffusionModule(dataSource: DataSource) {
  await seedPackTypes(dataSource);
  await seedDiffusionPermissions(dataSource);
}