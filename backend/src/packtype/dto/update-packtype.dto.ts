import { PartialType } from '@nestjs/mapped-types';
import { CreatePackTypeDto } from './create-packtype.dto';

export class UpdatePacktypeDto extends PartialType(CreatePackTypeDto) {}
