import { IsNotEmpty, IsEmail, IsOptional } from "class-validator";

import { CustomerPriority } from '@/customers/entity/customer.entity';


export class CreateCustomerDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  company?: string;

  priority?: CustomerPriority;
  
}
