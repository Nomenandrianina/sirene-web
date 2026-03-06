// src/database/seeds/permission.seed.ts
import { DataSource } from 'typeorm';

export async function seedPermissions(dataSource: DataSource): Promise<void> {
  const existing = await dataSource.query(`SELECT COUNT(*) as count FROM permissions`);
  if (parseInt(existing[0].count) > 0) {
    console.log('⏭️  Permissions already seeded, skipping...');
    return;
  }

  await dataSource.query(`
    INSERT INTO permissions (name)
    VALUES 
      ('users:read'),
      ('users:create'),
      ('users:update'),
      ('users:delete'),
      ('customers:read'),
      ('customers:create'),
      ('customers:update'),
      ('customers:delete'),
      ('roles:read'),
      ('roles:manage'),
      ('permissions:read'),
      ('permissions:manage')
  `);

  console.log('✅ Permissions seeded successfully');
}