// src/database/seeds/role.seed.ts
import { DataSource } from 'typeorm';

export async function seedProvince(dataSource: DataSource): Promise<void> {
  const existing = await dataSource.query(`SELECT COUNT(*) as count FROM provinces`);
  if (parseInt(existing[0].count) > 0) {
    console.log('⏭️  Roles already seeded, skipping...');
    return;
  }

  await dataSource.query(`
    INSERT INTO provinces (name)
    VALUES 
      ('ANTANANARIVO'),
      ('MAHAJANGA'),
      ('TOAMASINA'),
      ('ANTSIRANANA'),
      ('FIANARANTSOA'),
      ('TOLIARA')
  `);

  console.log('✅ province seeded successfully');
}