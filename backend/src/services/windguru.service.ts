import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import dayjs from 'dayjs';
import { ColorCode } from 'src/color-code/entities/color-code.entity';
import { AlertLevel } from 'src/alert-level/entities/alert-level.entity';
import { TimeSetting } from 'src/time-setting/entities/time-setting.entity';
import { Setting } from 'src/settings/entities/setting.entity';


// ── Types internes ──────────────────────────────────────────────────────────

interface WindguruOptions {
  query?:     string;
  id_model?:  string;
  latitude?:  number;
  longitude?: number;
  altitude?:  number;
}

interface DateTimeValue {
  date_time: string;
  value:     any;
}

interface WindDirResult {
  dir:        string;
  count:      number;
  has_equals: boolean;
}

export interface FinalWeatherEntry {
  type:     'GUST' | 'WINDIRNAME' | 'WINDSPD' | 'WVHGT' | 'COLOR' | 'ALERT';
  date:     string;
  day_part: 'AM' | 'PM';
  result:   any;
}

export interface VillageRef {
  id:        number;
  latitude:  number;
  longitude: number;
  lastWeatherFinalWeather?: FinalWeatherEntry[];
}

// ── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class WindguruService {
  // Fix 1: types optionnels pour éviter "undefined not assignable"
  private model_id:     string | undefined;
  private query:        string | undefined;
  private latitude:     number | undefined;
  private longitude:    number | undefined;
  private altitude:     number | undefined;
  private globalResult: any = {};
  private village:      VillageRef | null = null;

  constructor(
    @InjectRepository(ColorCode)
    private readonly colorCodeRepo: Repository<ColorCode>,

    @InjectRepository(AlertLevel)
    private readonly alertLevelRepo: Repository<AlertLevel>,

    @InjectRepository(TimeSetting)
    private readonly timeSettingRepo: Repository<TimeSetting>,

    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,

    private readonly configService: ConfigService,
  ) {}

  // ── Initialisation ────────────────────────────────────────────────────────

  async init(options: WindguruOptions = {}): Promise<void> {
    const defaults: WindguruOptions = {
      query:    'forecast_latlon',
      id_model: '3,45,92,83',
    };
    const opts = { ...defaults, ...options };

    this.query     = opts.query;
    this.model_id  = opts.id_model;
    this.latitude  = opts.latitude;
    this.longitude = opts.longitude;
    this.altitude  = opts.altitude;

    await this.fetchData();
  }

  setVillage(village: VillageRef): void {
    this.village = village;
  }

  // ── Build params ──────────────────────────────────────────────────────────

  private buildParams(): Record<string, any> {
    const params: Record<string, any> = {
      apiusername: this.configService.get('WINDGURU_API_USER_NAME'),
      apipassword: this.configService.get('WINDGURU_API_PASSWORD'),
      username:    this.configService.get('WINDGURU_USER_NAME'),
      password:    this.configService.get('WINDGURU_PASSWORD'),
    };

    if (this.model_id)  params['id_model'] = this.model_id;
    if (this.query)     params['q']        = this.query;
    if (this.latitude)  params['lat']      = this.latitude;
    if (this.longitude) params['lon']      = this.longitude;
    if (this.altitude)  params['alt']      = this.altitude;

    return params;
  }

  // ── Fetch Windguru API ────────────────────────────────────────────────────

  async fetchData(): Promise<void> {
    const params = this.buildParams();
    if (!params['q']) {
      this.globalResult = {};
      return;
    }

    const url   = this.configService.get('WINDGURU_API_URL');
    const query = new URLSearchParams(params).toString();

    try {
      const response = await axios.get(`${url}?${query}`, { timeout: 60000 });
      this.globalResult = response.data;
    } catch (error) {
      throw new Error(`Erreur Windguru API : ${error.message}`);
    }
  }

  // ── Getters résultats bruts ───────────────────────────────────────────────

  getHourOffset(): number {
    return this.globalResult['gmt_hour_offset'] ?? 0;
  }

  getInitDateTime(modelId: number | string): dayjs.Dayjs | null {
    const originalDatetime = this.globalResult['forecast']?.[modelId]?.['initdate'] ?? null;
    // Fix 2: import default dayjs (pas namespace)
    return originalDatetime ? dayjs(originalDatetime) : null;
  }

  getGlobalResult(): any {
    return this.globalResult;
  }

  // ── handleTimeZone ────────────────────────────────────────────────────────

  private handleTimeZone(
    modelId: number | string,
    data:    Record<string, any>,
    isKm  = true,
    round = true,
  ): Record<string, any> {
    const resultData: Record<string, any> = {};

    for (const [key, dataValue] of Object.entries(data)) {
      if (dataValue !== null && typeof dataValue === 'object') {
        resultData[key] = {};
        const entries = Object.entries(dataValue as Record<string, any>);

        for (const [keyChild, dataChildValue] of entries) {
          const initDt = this.getInitDateTime(modelId);
          if (!initDt) continue;

          const thatDate = initDt.add(
            this.getHourOffset() + Number(keyChild),
            'hour',
          );

          let trueValue: any;
          if (typeof dataChildValue === 'number' && round) {
            trueValue = Math.round(isKm ? dataChildValue * 1.852 : dataChildValue);
          } else {
            trueValue = dataChildValue;
          }

          resultData[key][keyChild] = {
            date_time: thatDate.format('YYYY-MM-DD HH:mm:ss'),
            value:     dataChildValue == null ? null : trueValue,
          };
        }
      } else {
        resultData[key] = dataValue;
      }
    }

    return resultData;
  }

  // ── Résultats par modèle ──────────────────────────────────────────────────

  getGfsResult(): Record<string, any> {
    if (!this.globalResult['forecast']?.['3']) return {};
    return this.handleTimeZone(3, this.globalResult['forecast']['3']);
  }

  getIconResult(): Record<string, any> {
    if (!this.globalResult['forecast']?.['45']) return {};
    return this.handleTimeZone(45, this.globalResult['forecast']['45']);
  }

  getAromeResult(): Record<string, any> {
    if (!this.globalResult['forecast']?.['92']) return {};
    return this.handleTimeZone(92, this.globalResult['forecast']['92']);
  }

  getGsfWaveResult(): Record<string, any> {
    if (!this.globalResult['forecast']?.['83']) return {};
    return this.handleTimeZone(83, this.globalResult['forecast']['83'], false, false);
  }

  // ── getByDateIWant ────────────────────────────────────────────────────────

  private async getByDateIWant(
    data:      Record<string, DateTimeValue>,
    date:      dayjs.Dayjs,
    timeField: 'AM' | 'PM' = 'AM',
    dataType:  string | null = null,
  ): Promise<DateTimeValue[]> {

    // Fix 3: utiliser IsNull() de TypeORM pour les where null
    let timeSetting: TimeSetting | null = null;

    if (dataType !== null) {
      timeSetting = await this.timeSettingRepo.findOne({
        where: { data_type: dataType, time_field: timeField },
      });
    }

    if (!timeSetting) {
      timeSetting = await this.timeSettingRepo.findOne({
        where: { data_type: IsNull(), time_field: timeField },
      });
    }

    const startTime = timeSetting?.start_time ?? (timeField === 'AM' ? '04:00:00' : '12:00:00');
    const endTime   = timeSetting?.end_time   ?? (timeField === 'AM' ? '12:01:00' : '22:00:00');

    const theDay = date.format('YYYY-MM-DD');
    const start  = dayjs(`${theDay} ${startTime}`);
    const end    = dayjs(`${theDay} ${endTime}`);

    return Object.values(data).filter((d) => {
      const thatDate = dayjs(d.date_time);
      return (
        thatDate.isAfter(start.subtract(1, 'ms')) &&
        thatDate.isBefore(end.add(1, 'ms'))
      );
    });
  }

  // ── Direction du vent ─────────────────────────────────────────────────────

  async getWindDirection(date: dayjs.Dayjs, timeDay: 'AM' | 'PM' = 'AM'): Promise<string> {
    const gfsComplet  = await this.getByDateIWant(this.getGfsResult()['WINDIRNAME']  ?? {}, date, timeDay);
    const gfsWindDir  = this.getWindDirectionCountPerValue(gfsComplet, timeDay);
    const highestGfs  = this.getHighestWindDir(gfsWindDir);

    const iconComplet = await this.getByDateIWant(this.getIconResult()['WINDIRNAME'] ?? {}, date, timeDay);
    const iconWindDir = this.getWindDirectionCountPerValue(iconComplet, timeDay);
    const highestIcon = this.getHighestWindDir(iconWindDir);

    if (
      highestGfs && highestIcon &&
      highestGfs.has_equals === false && highestIcon.has_equals === false &&
      highestGfs.count !== highestIcon.count
    ) {
      return highestGfs.count > highestIcon.count ? highestGfs.dir : highestIcon.dir;
    }

    if (highestGfs?.has_equals === true && highestIcon?.has_equals === false && highestGfs.count < highestIcon.count) {
      return highestIcon.dir;
    }

    if (highestIcon?.has_equals === true && highestGfs?.has_equals === false && highestGfs.count > highestIcon.count) {
      return highestGfs.dir;
    }

    const iconWindDirStrict = this.getWindDirectionCountPerValue(
      Object.values(this.getIconResult()['WINDIRNAME'] ?? {}),
      timeDay,
      true,
    );

    if (Object.keys(iconWindDirStrict).length > 0) return Object.keys(iconWindDirStrict)[0];
    if (highestIcon) return highestIcon.dir;
    if (highestGfs)  return highestGfs.dir;
    return '';
  }

  // ── Helpers direction ─────────────────────────────────────────────────────

  private getHighestWindDir(datas: Record<string, number>): WindDirResult | null {
    let highestLabel: string | null = null;
    let highestData:  number | null = null;
    let hasEquals = false;

    for (const [key, data] of Object.entries(datas)) {
      if (highestLabel === null) {
        highestLabel = key;
        highestData  = data;
      } else {
        // Fix 4: vérifier que highestData n'est pas null avant comparaison
        if (highestData !== null && highestData === data) hasEquals = true;
        else if (highestData !== null && highestData < data) {
          hasEquals    = false;
          highestLabel = key;
          highestData  = data;
        }
      }
    }

    return highestLabel
      ? { dir: highestLabel, count: datas[highestLabel], has_equals: hasEquals }
      : null;
  }

  private getWindDirectionCountPerValue(
    windDirections: DateTimeValue[],
    timeField:      'AM' | 'PM' = 'AM',
    isStrict        = false,
  ): Record<string, number> {
    const countPerValue: Record<string, number> = {};

    const filtered = windDirections.filter((wd) => {
      if (!isStrict) return true;
      const thatDate = dayjs(wd.date_time);
      return timeField === 'AM' ? thatDate.hour() === 9 : thatDate.hour() === 15;
    });

    for (const wd of filtered) {
      const val = wd.value;
      countPerValue[val] = (countPerValue[val] ?? 0) + 1;
    }

    return countPerValue;
  }

  // ── Valeur numérique la plus haute ───────────────────────────────────────

  private getHighestNumeric(values: DateTimeValue[]): number | null {
    let highest: number | null = null;
    for (const v of values) {
      if (v.value != null && (highest === null || v.value > highest)) {
        highest = v.value;
      }
    }
    return highest;
  }

  // ── Gust / WindSpeed / WavesHeight ───────────────────────────────────────

  async getGust(date: dayjs.Dayjs, timeDay: 'AM' | 'PM' = 'AM'): Promise<number | null> {
    const gfsComplet  = await this.getByDateIWant(this.getGfsResult()['GUST']  ?? {}, date, timeDay, 'GUST');
    const iconComplet = await this.getByDateIWant(this.getIconResult()['GUST'] ?? {}, date, timeDay, 'GUST');
    const highestGfs  = this.getHighestNumeric(gfsComplet)  ?? 0;
    const highestIcon = this.getHighestNumeric(iconComplet) ?? 0;
    return Math.max(highestGfs, highestIcon);
  }

  async getWindSpeed(date: dayjs.Dayjs, timeDay: 'AM' | 'PM' = 'AM'): Promise<number | null> {
    const gfsComplet  = await this.getByDateIWant(this.getGfsResult()['WINDSPD']  ?? {}, date, timeDay, 'WINDSPD');
    const iconComplet = await this.getByDateIWant(this.getIconResult()['WINDSPD'] ?? {}, date, timeDay, 'WINDSPD');
    const highestGfs  = this.getHighestNumeric(gfsComplet)  ?? 0;
    const highestIcon = this.getHighestNumeric(iconComplet) ?? 0;
    return Math.max(highestGfs, highestIcon);
  }

  async getWavesHeight(date: dayjs.Dayjs, timeDay: 'AM' | 'PM' = 'AM'): Promise<number | null> {
    const gfsWaveComplet = await this.getByDateIWant(this.getGsfWaveResult()['HTSGW'] ?? {}, date, timeDay);
    return this.getHighestNumeric(gfsWaveComplet);
  }

  // ── Code couleur ─────────────────────────────────────────────────────────

  // Fix 5: WINDSPD et GUST acceptent number | null
  async getCodeColor(data: { WINDSPD?: number | null; GUST?: number | null }): Promise<string> {
    const colorCodes = await this.colorCodeRepo.find({ order: { id: 'ASC' } });
    const setting    = await this.settingRepo.findOne({ where: {}, order: { id: 'ASC' } });

    let selectedColorId: number | null = null;

    if (data.WINDSPD != null) {
      for (const code of colorCodes) {
        const min = Number(code.windspd_min);
        const max = code.windspd_max != null ? Number(code.windspd_max) : null;

        if (data.WINDSPD >= min && (max === null || data.WINDSPD <= max)) {
          selectedColorId =
            selectedColorId !== null
              ? Math.max(selectedColorId, code.id)
              : code.id;
        }
      }
    }

    if (setting?.gust_alert != null && data.GUST != null && Number(setting.gust_alert) <= data.GUST) {
      selectedColorId = colorCodes[colorCodes.length - 1]?.id ?? null;
    }

    const codeColor = colorCodes.find((c) => c.id === selectedColorId);
    return codeColor?.value ?? '';
  }

  // ── Niveau d'alerte ───────────────────────────────────────────────────────

  // Fix 5 aussi: WINDSPD et WAVE acceptent number | null
  async getAlertLevel(data: {
    WINDSPD?:    number | null;
    WAVE?:       number | null;
    WINDIRNAME?: string;
    date?:       string;
    day_part?:   'AM' | 'PM';
  }): Promise<number | null> {
    if (!this.village) return null;

    const alerts      = await this.alertLevelRepo.find({ order: { id: 'ASC' } });
    let alertLevel: number | null = null;

    if (data.WINDSPD != null && data.WAVE != null && data.WINDIRNAME && data.date && data.day_part) {
      for (const alert of alerts) {
        const wsMin = alert.windspd_min != null ? Number(alert.windspd_min) : null;
        const wsMax = alert.windspd_max != null ? Number(alert.windspd_max) : null;
        const wvMin = alert.wave_min    != null ? Number(alert.wave_min)    : null;
        const wvMax = alert.wave_max    != null ? Number(alert.wave_max)    : null;

        const windspdOk = (wsMin === null || data.WINDSPD >= wsMin) && (wsMax === null || data.WINDSPD < wsMax);
        const waveOk    = (wvMin === null || data.WAVE    >= wvMin) && (wvMax === null || data.WAVE    < wvMax);

        if (windspdOk && waveOk) {
          alertLevel = alertLevel !== null ? Math.max(alertLevel, alert.id) : alert.id;
        }
      }
    }

    return alertLevel;
  }

  // ── Helper statique ───────────────────────────────────────────────────────

  static getLastValueOf(
    data:      FinalWeatherEntry[],
    valueName: string,
    date:      string,
    dayPart:   'AM' | 'PM',
  ): any {
    for (const entry of data) {
      if (entry.type === valueName && entry.date === date && entry.day_part === dayPart) {
        return entry.result;
      }
    }
    return null;
  }

  // ── getProcessedWeather ───────────────────────────────────────────────────

  async getProcessedWeather(): Promise<FinalWeatherEntry[]> {
    const allDates = Array.from({ length: 11 }, (_, i) =>
      dayjs().add(i, 'day').format('YYYY-MM-DD'),
    );

    const finalWeather: FinalWeatherEntry[] = [];

    for (const date of allDates) {
      const d = dayjs(date);

      const gustAm = await this.getGust(d, 'AM');
      const gustPm = await this.getGust(d, 'PM');
      finalWeather.push({ type: 'GUST', date, day_part: 'AM', result: gustAm });
      finalWeather.push({ type: 'GUST', date, day_part: 'PM', result: gustPm });

      const windirAm = await this.getWindDirection(d, 'AM');
      const windirPm = await this.getWindDirection(d, 'PM');
      finalWeather.push({ type: 'WINDIRNAME', date, day_part: 'AM', result: windirAm });
      finalWeather.push({ type: 'WINDIRNAME', date, day_part: 'PM', result: windirPm });

      const windspdAm = await this.getWindSpeed(d, 'AM');
      const windspdPm = await this.getWindSpeed(d, 'PM');
      finalWeather.push({ type: 'WINDSPD', date, day_part: 'AM', result: windspdAm });
      finalWeather.push({ type: 'WINDSPD', date, day_part: 'PM', result: windspdPm });

      const waveAm = await this.getWavesHeight(d, 'AM');
      const wavePm = await this.getWavesHeight(d, 'PM');
      finalWeather.push({ type: 'WVHGT', date, day_part: 'AM', result: waveAm });
      finalWeather.push({ type: 'WVHGT', date, day_part: 'PM', result: wavePm });

      // Fix 5: passer number | null directement
      const colorAm = await this.getCodeColor({ WINDSPD: windspdAm, GUST: gustAm });
      const colorPm = await this.getCodeColor({ WINDSPD: windspdPm, GUST: gustPm });
      finalWeather.push({ type: 'COLOR', date, day_part: 'AM', result: colorAm });
      finalWeather.push({ type: 'COLOR', date, day_part: 'PM', result: colorPm });

      const alertAm = await this.getAlertLevel({ WINDSPD: windspdAm, WAVE: waveAm, WINDIRNAME: windirAm, date, day_part: 'AM' });
      const alertPm = await this.getAlertLevel({ WINDSPD: windspdPm, WAVE: wavePm, WINDIRNAME: windirPm, date, day_part: 'PM' });
      finalWeather.push({ type: 'ALERT', date, day_part: 'AM', result: alertAm });
      finalWeather.push({ type: 'ALERT', date, day_part: 'PM', result: alertPm });
    }

    return finalWeather;
  }

  // ── fetchWeatherByGps ─────────────────────────────────────────────────────

  async fetchWeatherByGps(
    latitude:  number,
    longitude: number,
    alt      = 0,
    village?: VillageRef,
  ) {
    await this.init({ latitude, longitude, altitude: alt });
    if (village) this.setVillage(village);

    const finalWeather = await this.getProcessedWeather();

    return {
      gfs:              this.getGfsResult(),
      icon:             this.getIconResult(),
      gfs_wave:         this.getGsfWaveResult(),
      arome:            this.getAromeResult(),
      original_weather: this.getGlobalResult(),
      final_weather:    finalWeather,
    };
  }
}