// src/database/seeds/role.seed.ts
import { DataSource } from 'typeorm';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const existing = await dataSource.query(`SELECT COUNT(*) as count FROM roles`);
  if (parseInt(existing[0].count) > 0) {
    console.log('⏭️  Roles already seeded, skipping...');
    return;
  }

  await dataSource.query(`
    INSERT INTO roles (name)
    VALUES 
      ('superadmin'),
      ('admin'),
      ('manager'),
      ('user')
  `);

  console.log('✅ Roles seeded successfully');
}