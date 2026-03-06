// src/database/seeds/user.seed.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const existing = await dataSource.query(`SELECT COUNT(*) as count FROM users`);
  if (parseInt(existing[0].count) > 0) {
    console.log('⏭️  Users already seeded, skipping...');
    return;
  }

  // Récupération des IDs de rôles dynamiquement
  const roles = await dataSource.query(`SELECT id, name FROM roles`);
  const roleMap: Record<string, number> = {};
  roles.forEach((r: { id: number; name: string }) => {
    roleMap[r.name] = r.id;
  });

  const superadminPassword = await bcrypt.hash('AZERTY', 10);
  const adminPassword      = await bcrypt.hash('AZERTY', 10);
  const managerPassword    = await bcrypt.hash('AZERTY', 10);
  const userPassword       = await bcrypt.hash('AZERTY', 10);

  // ⚠️ Le superadmin n'a PAS de customers_id
  await dataSource.query(`
    INSERT INTO users (first_name,last_name,  email, password, roleId, is_active, customer_id)
    VALUES 
      ('Super Admin', 'Super Admin',    'superadmin@app.com',  '${superadminPassword}', ${roleMap['superadmin']}, 1, NULL),
      ('Admin Alpha',  'Admin Alpha',   'admin@alpha.com',      '${adminPassword}',      ${roleMap['admin']},      1, 1),
      ('Manager Alpha', 'Admin Alpha',   'manager@alpha.com',    '${managerPassword}',    ${roleMap['manager']},    1, 1),
      ('User Alpha',  'Admin Alpha',    'user@alpha.com',        '${userPassword}',       ${roleMap['user']},       1, 1),
      ('Admin Demo',  'Admin Alpha',    'admin@demo.com',        '${adminPassword}',      ${roleMap['admin']},      1, 2),
      ('User Demo',   'Admin Alpha',    'user@demo.com',         '${userPassword}',       ${roleMap['user']},       1, 2)
  `);

  console.log('✅ Users seeded successfully');
  console.log('');
  console.log('🔐 Credentials créés :');
  console.log('   superadmin@app.com  →  Superadmin@2024!  (aucun client)');
  console.log('   admin@alpha.com     →  Admin@2024!       (Customer: Entreprise Alpha)');
  console.log('   manager@alpha.com   →  Manager@2024!     (Customer: Entreprise Alpha)');
  console.log('   user@alpha.com      →  User@2024!        (Customer: Entreprise Alpha)');
  console.log('   admin@demo.com      →  Admin@2024!       (Customer: Client Démo)');
  console.log('   user@demo.com       →  User@2024!        (Customer: Client Démo)');
}
