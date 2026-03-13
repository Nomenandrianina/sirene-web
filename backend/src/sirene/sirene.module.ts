import { Module }           from '@nestjs/common';
import { TypeOrmModule }    from '@nestjs/typeorm';
import { Sirene }           from './entities/sirene.entity';
import { Customer }         from '../customers/entity/customer.entity';
import { SirenesService }   from './sirene.service';
import { SirenesController } from './sirene.controller';
import { SmsModule }        from '../sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sirene, Customer]),
    SmsModule,
  ],
  controllers: [SirenesController],
  providers:   [SirenesService],
  exports:     [SirenesService],
})
export class SirenesModule {}