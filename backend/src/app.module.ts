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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // importe ConfigModule pour l’injection
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: +config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME', 'root'), 
        password: config.get<string>('DB_PASSWORD', ''), 
        database: config.get<string>('DB_DATABASE', 'sirene_web'),
        entities: [Role,Permission,User,Customer,Province,Region, District,Village],
        synchronize: true,
      }),
    })
    ,RolesModule, PermissionsModule, UsersModule,CustomersModule,AuthModule, ProvincesModule, RegionsModule, DistrictsModule, VillagesModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard,}],
})
export class AppModule {}
