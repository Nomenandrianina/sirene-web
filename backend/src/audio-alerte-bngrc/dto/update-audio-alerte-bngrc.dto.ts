import { PartialType } from '@nestjs/mapped-types';
import { CreateAudioAlerteBngrcDto } from './create-audio-alerte-bngrc.dto';

export class UpdateAudioAlerteBngrcDto extends PartialType(CreateAudioAlerteBngrcDto) {}
