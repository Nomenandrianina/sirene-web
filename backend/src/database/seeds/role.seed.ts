// src/database/seeds/role.seed.ts
import { DataSource } from 'typeorm';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    INSERT IGNORE INTO roles (name)
    VALUES 
      ('SUPERADMIN'),
      ('BNGRC_ALERTE'),
      ('CUSTOMER_ADMIN'),
      ('CUSTOMER_OPERATOR'),
      ('BNGRC_CONTROL')
  `);

  console.log('✅ Roles seeded successfully');
}