import { DataSource } from 'typeorm';
import { Setting } from 'src/settings/entities/setting.entity';

export async function seedSettings(dataSource: DataSource) {
  const repo = dataSource.getRepository(Setting);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('Setting: déjà seedé, skip.');
    return;
  }

  await repo.save({
    phone:                      null,
    email:                      null,
    adresse:                    null,
    tva:                        20.00,
    currency:                   'MGA',
    max_focal_point:            '3',
    subscription_extension_days: 3,
    country:                    'Madagascar',
    province_labels:            'Provinces',
    province_label:             'Province',
    region_labels:              'Régions',
    region_label:               'Région',
    village_labels:             'Villages',
    village_label:              'Village',
    district_labels:            'Districts',
    district_label:             'District',
    notification_sending_time:  '08:00',
    gust_alert:                 40.0000,
  });

  console.log('Setting: seedé avec succès (1 entrée).');
}