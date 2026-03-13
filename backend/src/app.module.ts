import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './roles/entities/role.entity';
import { PermissionsModule } from './permissions/permissions.module';
import { Permission } from './permissions/entities/permission.entity';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { Customer } from './customers/entity/customer.entity';
import { CustomersModule } from './customers/customers.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core/constants';
import { AuthGuard } from './auth/guards/auth.guard';
import { ProvincesModule } from './provinces/provinces.module';
import { RegionsModule } from './regions/regions.module';
import { Province } from './provinces/entities/province.entity';
import { Region } from './regions/entities/region.entity';
import { DistrictsModule } from './districts/districts.module';
import { District } from './districts/entities/district.entity';
import { VillagesModule } from './villages/villages.module';
import { Village } from './villages/entities/village.entity';
import { FlowsModule } from './flows/flows.module';
import { WeathersModule } from './weathers/weathers.module';
import { Flow } from './flows/entities/flow.entity';
import { Weather } from './weathers/entities/weather.entity';
import { ColorCodeModule } from './color-code/color-code.module';
import { AlertLevelModule } from './alert-level/alert-level.module';
import { SettingsModule } from './settings/settings.module';
import { TimeSettingModule } from './time-setting/time-setting.module';
import { ColorCode } from './color-code/entities/color-code.entity';
import { AlertLevel } from './alert-level/entities/alert-level.entity';
import { Setting } from './settings/entities/setting.entity';
import { TimeSetting } from './time-setting/entities/time-setting.entity';
import { ExportModule } from './export/export.module';
import { SmsModule } from './sms/sms.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuditLog }    from './audit-log/entity/audit-log.entity';
import { AuditLogInterceptor } from './audit-log/interceptors/audit-log.interceptor';
import { SirenesModule } from './sirene/sirene.module';
import { Sirene } from './sirene/entities/sirene.entity';
import { AlerteModule } from './alerte/alerte.module';
import { AlerteTypeModule } from './alerte-type/alerte-type.module';
import { CategorieAlerteModule } from './categorie-alerte/categorie-alerte.module';
import { SousCategorieAlerteModule } from './sous-categorie-alerte/sous-categorie-alerte.module';
import { AlerteAudioModule } from './alerte-audio/alerte-audio.module';
import { Alerte } from './alerte/entities/alerte.entity';
import { AlerteType } from './alerte-type/entities/alerte-type.entity';
import { CategorieAlerte } from './categorie-alerte/entities/categorie-alerte.entity';
import { SousCategorieAlerte } from './sous-categorie-alerte/entities/sous-categorie-alerte.entity';
import { AlerteAudio } from './alerte-audio/entities/alerte-audio.entity';
import { NotificationModule } from './notification/notification.module';
import { Notification } from './notification/entities/notification.entity';
import { SendAlerteModule } from './sendalerte/send-alerte.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // importe ConfigModule pour l’injection
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: + config.get<number>('DB_PORT',3306),
        username: config.get<string>('DB_USERNAME'), 
        password: config.get<string>('DB_PASSWORD'), 
        database: config.get<string>('DB_DATABASE'),
        entities: [Role,Permission,User,Customer,Province,Region, District,Village,Flow,Weather,ColorCode,AlertLevel,Setting,TimeSetting,AuditLog,Sirene,Alerte,AlerteType,CategorieAlerte,SousCategorieAlerte,AlerteAudio,Notification],
        synchronize: true,
      }),
    })
    ,RolesModule, PermissionsModule, UsersModule,CustomersModule,AuthModule, ProvincesModule, RegionsModule, DistrictsModule, VillagesModule, FlowsModule, WeathersModule, ColorCodeModule, AlertLevelModule, SettingsModule, TimeSettingModule,ExportModule,
    SmsModule,AuditLogModule, SirenesModule, AlerteModule, AlerteTypeModule, CategorieAlerteModule, SousCategorieAlerteModule, AlerteAudioModule, NotificationModule,SendAlerteModule
    
  ],
  controllers: [AppController],
  providers: [AppService,  { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor }, { provide: APP_GUARD, useClass: AuthGuard,}],
})
export class AppModule {}
