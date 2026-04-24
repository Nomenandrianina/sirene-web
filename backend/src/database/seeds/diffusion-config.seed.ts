// src/database/seeds/diffusion-config.seed.ts
import { DataSource } from 'typeorm';

export async function seedDiffusionConfigs(dataSource: DataSource): Promise<void> {
  const existing = await dataSource.query(`SELECT COUNT(*) as count FROM diffusion_config`);
  if (parseInt(existing[0].count) > 0) {
    console.log('⏭️  DiffusionConfigs already seeded, skipping...');
    return;
  }

  // Récupérer toutes les régions présentes en base
  const regions = await dataSource.query(`SELECT id, name FROM regions`);

  if (!regions.length) {
    console.log('⚠️  Aucune région trouvée — seedDiffusionConfigs ignoré');
    return;
  }

  // Config globale (fallback)
  await dataSource.query(`
    INSERT INTO diffusion_config (region_id, label, send_hour, send_minute, send_days, is_active)
    VALUES (NULL, 'Global', 3, 0, NULL, 1)
  `);

  // Une config par région — toutes à 3h par défaut, tous les jours
  for (const region of regions) {
    await dataSource.query(`
      INSERT INTO diffusion_config (region_id, label, send_hour, send_minute, send_days, is_active)
      VALUES (?, ?, 3, 0, NULL, 1)
    `, [region.id, region.name]);
  }

  console.log(`✅ DiffusionConfigs seeded — 1 global + ${regions.length} région(s)`);
}