
import { DataSource } from 'typeorm';
import { TimeSetting } from 'src/time-setting/entities/time-setting.entity';

export async function seedTimeSettings(dataSource: DataSource) {
    const repo = dataSource.getRepository(TimeSetting);
  
    const existing = await repo.count();
    if (existing > 0) {
      console.log('TimeSetting: déjà seedé, skip.');
      return;
    }
  
    await repo.save([
      { data_type: 'GUST',       time_field: 'AM', start_time: '04:00:00', end_time: '12:00:00' },
      { data_type: 'WINDSPD',    time_field: 'AM', start_time: '04:00:00', end_time: '12:00:00' },
      { data_type: 'WVHGT',      time_field: 'AM', start_time: '04:00:00', end_time: '12:00:00' },
      { data_type: 'WINDIRNAME', time_field: 'AM', start_time: '04:00:00', end_time: '12:00:00' },
      { data_type: 'GUST',       time_field: 'PM', start_time: '12:01:00', end_time: '22:00:00' },
      { data_type: 'WINDSPD',    time_field: 'PM', start_time: '12:01:00', end_time: '22:00:00' },
      { data_type: 'WVHGT',      time_field: 'PM', start_time: '12:01:00', end_time: '22:00:00' },
      { data_type: 'WINDIRNAME', time_field: 'PM', start_time: '12:01:00', end_time: '22:00:00' },
      { data_type: null,          time_field: 'AM', start_time: '04:00:00', end_time: '12:00:00' },
      { data_type: null,          time_field: 'PM', start_time: '12:01:00', end_time: '22:00:00' },
    ]);
  
    console.log('TimeSetting: seedé avec succès (10 entrées).');
  }