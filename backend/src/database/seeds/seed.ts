// src/database/seeds/seed.ts
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { seedCustomers }   from './customer.seed';
import { seedRoles }       from './role.seed';
import { seedPermissions } from './permission.seed';
import { seedUsers }       from './user.seed';

const AppDataSource = new DataSource({
  type: 'mysql',
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'sirene_web',
  entities: [],
  synchronize: false,
});

async function runSeeders() {
  try {
    await AppDataSource.initialize();
    console.log('🔌 Database connected\n');

    // ⚠️ L'ordre est important à cause des FK
    await seedCustomers(AppDataSource);
    await seedRoles(AppDataSource);
    await seedPermissions(AppDataSource);
    await seedUsers(AppDataSource);

    console.log('\n🌱 All seeders completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeders();