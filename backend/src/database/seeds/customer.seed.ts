// src/database/seeds/customer.seed.ts
import { DataSource } from 'typeorm';

export async function seedCustomers(dataSource: DataSource): Promise<void> {
  const existing = await dataSource.query(`SELECT COUNT(*) as count FROM customers`);
  console.log('existing :',existing)
  if (parseInt(existing[0].count) > 0) {
    console.log('⏭️  Customers already seeded, skipping...');
    return;
  }

  await dataSource.query(`
    INSERT INTO customers (id, name, company, description ,adresse)
    VALUES 
      (1, 'BNGRC', '', '', ''),
      (2, 'WWF', '', '','')
  `);

  console.log('✅ Customers seeded successfully');
}