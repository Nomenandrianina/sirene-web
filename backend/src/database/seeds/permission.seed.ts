import { DataSource } from "typeorm";

export async function seedPermissions(dataSource: DataSource) {

  await dataSource.query(`
  INSERT IGNORE INTO permissions (name) VALUES

    ('users:read'),
    ('users:create'),
    ('users:update'),
    ('users:delete'),

    ('customers:read'),
    ('customers:create'),
    ('customers:update'),
    ('customers:delete'),

    ('roles:read'),
    ('roles:create'),
    ('roles:update'),
    ('roles:delete'),

    ('permissions:read'),
    ('permissions:create'),
    ('permissions:update'),
    ('permissions:delete'),

    ('provinces:read'),
    ('provinces:create'),
    ('provinces:update'),
    ('provinces:delete'),

    ('regions:read'),
    ('regions:create'),
    ('regions:update'),
    ('regions:delete'),

    ('districts:read'),
    ('districts:create'),
    ('districts:update'),
    ('districts:delete'),

    ('villages:read'),
    ('villages:create'),
    ('villages:update'),
    ('villages:delete'),

    ('sirenes:read'),
    ('sirenes:create'),
    ('sirenes:update'),
    ('sirenes:delete'),

    ('alertes:read'),
    ('alertes:create'),
    ('alertes:update'),
    ('alertes:delete'),

    ('alerte-types:read'),
    ('alerte-types:create'),
    ('alerte-types:update'),
    ('alerte-types:delete'),

    ('categorie-alertes:read'),
    ('categorie-alertes:create'),
    ('categorie-alertes:update'),
    ('categorie-alertes:delete'),

    ('sous-categorie-alertes:read'),
    ('sous-categorie-alertes:create'),
    ('sous-categorie-alertes:update'),
    ('sous-categorie-alertes:delete'),

    ('alerte-audios:read'),
    ('alerte-audios:create'),
    ('alerte-audios:update'),
    ('alerte-audios:delete'),
    ('alerte-audios:review'),

    ('notifications:read'),
    ('notifications:create'),
    ('notifications:update'),
    ('notifications:delete'),

    ('send-alerte:execute'),
    ('offre:read'),
    ('planning:read'),

    
    ('alertebngrc:read'),
    ('alertebngrc:create'),
    ('alertebngrc:update'),
    ('alertebngrc:delete'),

    ('typealertebngrc:read'),
    ('typealertebngrc:create'),
    ('typealertebngrc:update'),
    ('typealertebngrc:delete'),

    ('categorie-alerte-bngrc:read'),
    ('categorie-alerte-bngrc:create'),
    ('categorie-alerte-bngrc:update'),
    ('categorie-alerte-bngrc:delete'),

    ('audio-alerte-bngrc:read'),
    ('audio-alerte-bngrc:create'),
    ('audio-alerte-bngrc:update'),
    ('audio-alerte-bngrc:delete'),
    
    ('alerte-bngrc:send'),
    ('notification-bngrc:read'),
    ('sirene-map-alert:read'),
    ('sirene-map-alert:story'),
    ('sirene-map:read'),
    ('planning:read-customer')

`);

  console.log("✅ Permissions seedées (65 permissions)");
}