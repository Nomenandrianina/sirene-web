import { DataSource } from 'typeorm';

export async function seedCommuneFokontanyPermissions(dataSource: DataSource) {
  const newPermissions = [
    // Communes
    'communes:read',
    'communes:create',
    'communes:update',
    'communes:delete',

    // Fokontany
    'fokontany:read',
    'fokontany:create',
    'fokontany:update',
    'fokontany:delete',
  ];

  // Insérer uniquement celles qui n'existent pas encore
  for (const name of newPermissions) {
    const existing = await dataSource.query(
      'SELECT COUNT(*) as cnt FROM permissions WHERE name = ?',
      [name],
    );
    if (parseInt(existing[0].cnt) === 0) {
      await dataSource.query('INSERT INTO permissions (name) VALUES (?)', [name]);
      console.log(`  ✅ Permission ajoutée : ${name}`);
    } else {
      console.log(`  ⏭️  Permission déjà existante — skip : ${name}`);
    }
  }

  console.log('✅ Seeder communes & fokontany terminé (8 permissions)');
}