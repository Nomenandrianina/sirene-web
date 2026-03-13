import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeSettingDto } from './create-time-setting.dto';

export class UpdateTimeSettingDto extends PartialType(CreateTimeSettingDto) {}
