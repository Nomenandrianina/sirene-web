// Remplacer dans seed.ts :

// ✅ Après — process.cwd() part toujours de la racine du projet
// entities: [path.join(process.cwd(), "dist/**/*.entity.js")],

// ─────────────────────────────────────────────────────────────────
// Votre seed.ts corrigé complet :
// ─────────────────────────────────────────────────────────────────

import { DataSource } from 'typeorm';
import * as path from 'path';
import { seedCustomers }    from './customer.seed';
import { seedRoles }        from './role.seed';
import { seedPermissions }  from './permission.seed';
import { seedUsers }        from './user.seed';
import { seedProvince }     from './province.seed';
import { seedColorCodes }   from './colocode.seed';
import { seedTimeSettings } from './timesetting.seed';
import { seedSettings }     from './setting.seed';
import { seedAlertes }      from './alert.seed';

const AppDataSource = new DataSource({
  type:     'mysql',
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'sirene_web',
  // Charge TOUS les fichiers .entity.js compilés depuis la racine
  entities: [path.join(process.cwd(), 'dist/**/*.entity.js')],
  synchronize: false,
});

async function runSeeders() {
  try {
    await AppDataSource.initialize();
    console.log('🔌 Database connected\n');

    await seedCustomers(AppDataSource);
    await seedRoles(AppDataSource);
    await seedPermissions(AppDataSource);
    await seedUsers(AppDataSource);
    await seedProvince(AppDataSource);
    await seedColorCodes(AppDataSource);
    await seedTimeSettings(AppDataSource);
    await seedSettings(AppDataSource);
    await seedAlertes(AppDataSource);

    console.log('\n🌱 All seeders completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeders();