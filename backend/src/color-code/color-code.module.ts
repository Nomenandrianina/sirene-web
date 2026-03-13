import { Module } from '@nestjs/common';
import { ColorCodeService } from './color-code.service';
import { ColorCodeController } from './color-code.controller';

@Module({
  controllers: [ColorCodeController],
  providers: [ColorCodeService],
  exports: [ColorCodeService],
})
export class ColorCodeModule {}
