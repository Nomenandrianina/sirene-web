import { DataSource } from "typeorm";

export async function seedPermissions(dataSource: DataSource) {
  const existing = await dataSource.query("SELECT COUNT(*) as cnt FROM permissions");
  if (parseInt(existing[0].cnt) > 0) {
    console.log("Permissions déjà seedées — skip");
    return;
  }

  await dataSource.query(`
    INSERT INTO permissions (name) VALUES
      -- Utilisateurs
      ('users:read'),
      ('users:create'),
      ('users:update'),
      ('users:delete'),

      -- Clients
      ('customers:read'),
      ('customers:create'),
      ('customers:update'),
      ('customers:delete'),

      -- Rôles
      ('roles:read'),
      ('roles:create'),
      ('roles:update'),
      ('roles:delete'),

      -- Permissions
      ('permissions:read'),
      ('permissions:create'),
      ('permissions:update'),
      ('permissions:delete'),

      -- Provinces
      ('provinces:read'),
      ('provinces:create'),
      ('provinces:update'),
      ('provinces:delete'),

      -- Régions
      ('regions:read'),
      ('regions:create'),
      ('regions:update'),
      ('regions:delete'),

      -- Districts
      ('districts:read'),
      ('districts:create'),
      ('districts:update'),
      ('districts:delete'),

      -- Villages
      ('villages:read'),
      ('villages:create'),
      ('villages:update'),
      ('villages:delete'),

      -- Sirènes
      ('sirenes:read'),
      ('sirenes:create'),
      ('sirenes:update'),
      ('sirenes:delete'),

      -- Alertes
      ('alertes:read'),
      ('alertes:create'),
      ('alertes:update'),
      ('alertes:delete'),

      -- Types d alerte
      ('alerte-types:read'),
      ('alerte-types:create'),
      ('alerte-types:update'),
      ('alerte-types:delete'),

      -- Catégories d alerte
      ('categorie-alertes:read'),
      ('categorie-alertes:create'),
      ('categorie-alertes:update'),
      ('categorie-alertes:delete'),

      -- Sous-catégories d alerte
      ('sous-categorie-alertes:read'),
      ('sous-categorie-alertes:create'),
      ('sous-categorie-alertes:update'),
      ('sous-categorie-alertes:delete'),

      -- Audios alerte
      ('alerte-audios:read'),
      ('alerte-audios:create'),
      ('alerte-audios:update'),
      ('alerte-audios:delete'),

      -- Notifications
      ('notifications:read'),
      ('notifications:create'),
      ('notifications:update'),
      ('notifications:delete'),

      -- Envoi alerte
      ('send-alerte:execute')
  `);

  console.log("✅ Permissions seedées (65 permissions)");
}