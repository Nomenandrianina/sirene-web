import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWeatherDto } from './dto/create-weather.dto';
import { UpdateWeatherDto } from './dto/update-weather.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Flow } from 'src/flows/entities/flow.entity';
import { Weather } from './entities/weather.entity';
import { Repository } from 'typeorm';
import { WindguruService } from 'src/services/windguru.service';
import { Village } from 'src/villages/entities/village.entity';

@Injectable()
export class WeathersService {


  constructor(
    @InjectRepository(Flow)
    private readonly flowRepo: Repository<Flow>,

    @InjectRepository(Weather)
    private readonly weatherRepo: Repository<Weather>,

    @InjectRepository(Village)
    private readonly villageRepo: Repository<Village>,

    private readonly windguruService: WindguruService,
  ) {}

 /**
   * Équivalent de WeatherController::store() Laravel
   * 1. Cherche un weather du jour en cache
   * 2. Si cache valide → retourne directement
   * 3. Sinon → appelle Windguru, sauvegarde Flow + Weather, retourne
   */
 async storeByVillage(villageId: number) {
  // ── 1. Charger le village ──
  const village = await this.villageRepo.findOne({ where: { id: villageId } });
  if (!village) throw new NotFoundException(`Village #${villageId} introuvable`);

  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // ── 2. Vérifier le cache du jour ──
  const existingWeather = await this.weatherRepo
    .createQueryBuilder('w')
    .where('w.village_id = :villageId', { villageId })
    .andWhere('w.deleted_at IS NULL')
    .orderBy('w.created_at', 'DESC')
    .getOne();

  if (
    existingWeather &&
    Array.isArray(existingWeather.final_weather) &&
    existingWeather.final_weather.length > 0 &&
    (existingWeather.final_weather as any[])[0]['date'] === currentDate
  ) {
    // Cache valide
    return [
      {
        final_weather: existingWeather.final_weather,
        arome:         existingWeather.arome,
      },
    ];
  }

  // ── 3. Appeler Windguru ──
  const lat = parseFloat(village.latitude);
  const lng = parseFloat(village.longitude);

  // Passer le dernier final_weather connu pour le calcul des alertes
  const villageRef = {
    id:        village.id,
    latitude:  lat,
    longitude: lng,
    lastWeatherFinalWeather: existingWeather?.final_weather as any[] ?? [],
  };

  const weatherData = await this.windguruService.fetchWeatherByGps(
    lat,
    lng,
    0,
    villageRef,
  );

  // ── 4. Créer Flow ──
  const flow = this.flowRepo.create({
    reference: '',
    date:      new Date(),
    type:      'forecast',
  });
  const savedFlow = await this.flowRepo.save(flow);

  // ── 5. Créer Weather lié au Flow ──
  const weather = this.weatherRepo.create({
    flow_id:          savedFlow.id,
    village_id:       village.id,
    gfs:              weatherData.gfs,
    icon:             weatherData.icon,
    gfs_wave:         weatherData.gfs_wave,
    arome:            weatherData.arome,
    original_weather: weatherData.original_weather,
    final_weather:    weatherData.final_weather,
  });
  await this.weatherRepo.save(weather);

  // ── 6. Retourner dans le même format que Laravel ──
  return [
    {
      final_weather: weatherData.final_weather,
      arome:         weatherData.arome,
    },
  ];
}

  create(createWeatherDto: CreateWeatherDto) {
    return 'This action adds a new weather';
  }

  findAll() {
    return `This action returns all weathers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} weather`;
  }

  update(id: number, updateWeatherDto: UpdateWeatherDto) {
    return `This action updates a #${id} weather`;
  }

  remove(id: number) {
    return `This action removes a #${id} weather`;
  }


  
}
