import { DataSource } from 'typeorm';
import { ColorCode } from 'src/color-code/entities/color-code.entity';

export async function seedColorCodes(dataSource: DataSource) {
  const repo = dataSource.getRepository(ColorCode);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('ColorCode: déjà seedé, skip.');
    return;
  }

  await repo.save([
    { name: 'VERT',   value: 'green',  windspd_min: 0,  windspd_max: 5,  wave_min: null, wave_max: null },
    { name: 'JAUNE',  value: 'yellow', windspd_min: 6,  windspd_max: 19, wave_min: null, wave_max: null },
    { name: 'ORANGE', value: 'orange', windspd_min: 20, windspd_max: 28, wave_min: null, wave_max: null },
    { name: 'ROUGE',  value: 'red',    windspd_min: 29, windspd_max: null, wave_min: null, wave_max: null },
  ]);

  console.log('ColorCode: seedé avec succès (4 entrées).');
}
