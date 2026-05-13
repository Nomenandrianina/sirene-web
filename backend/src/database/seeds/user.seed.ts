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
    INSERT INTO users (first_name,last_name,  email, password, roleId, is_active, customer_id,avatar_url)
    VALUES 
      ('Super Admin', 'Super Admin',    'superadmin@app.com',  '${superadminPassword}', ${roleMap['SUPERADMIN']}, 1, NULL,NULL),
      ('client admin', 'client admin',    'admin_mtec@gmail.com',  '${superadminPassword}', ${roleMap['CUSTOMER_ADMIN']}, 1, 3 ,NULL),
      ('user m-tec', 'user m-tec',    'user_mtec@gmail.com',  '${superadminPassword}', ${roleMap['CUSTOMER_OPERATOR']}, 1, 3 ,NULL),
      ('client bngrc', 'client bngrc',    'user_bngrc_alerte@gmail.com',  '${superadminPassword}', ${roleMap['BNGRC_ALERTE']}, 1, 1 ,NULL)
  `);

  console.log('✅ Users seeded successfully');
  console.log('');
  console.log('🔐 Credentials créés :');
}
