import { Module } from '@nestjs/common';
import { AlertLevelService } from './alert-level.service';
import { AlertLevelController } from './alert-level.controller';

@Module({
  controllers: [AlertLevelController],
  providers: [AlertLevelService],
})
export class AlertLevelModule {}
