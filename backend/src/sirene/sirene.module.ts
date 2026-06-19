import { Module }           from '@nestjs/common';
import { TypeOrmModule }    from '@nestjs/typeorm';
import { Sirene }           from './entities/sirene.entity';
import { Customer }         from '../customers/entity/customer.entity';
import { SirenesService }   from './sirene.service';
import { SirenesController } from './sirene.controller';
import { SmsModule }        from '../sms/sms.module';
import { AudioAlerteBngrc } from 'src/audio-alerte-bngrc/entities/audio-alerte-bngrc.entity';
import { User } from 'src/users/entities/user.entity';
import { Notificationsweb } from 'src/notificationsweb/entities/notificationsweb.entity';
import { Village } from 'src/villages/entities/village.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sirene, Customer, AudioAlerteBngrc,User,Notificationsweb,Village]),
    SmsModule,
  ],
  controllers: [SirenesController],
  providers:   [SirenesService],
  exports:     [SirenesService],
})
export class SirenesModule {}