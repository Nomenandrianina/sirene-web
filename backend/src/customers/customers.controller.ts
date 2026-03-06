import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Audit } from 'src/audit-log/decorators/audit.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Audit('CREATE', 'Customer')
  @Post()
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    const customer = await this.customersService.create(createCustomerDto);
    return { status: 200, message: 'Client créé avec succès', response: customer };
  }

  @Get()
  async findAll(@Req() req: Request) {
    const customers = await this.customersService.findAll(req['user']);
    return { status: 200, message: 'Clients récupérés avec succès', response: customers };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const customer = await this.customersService.findOne(+id, req['user']);
    return { status: 200, message: 'Client récupéré avec succès', response: customer };
  }

  @Audit('UPDATE', 'Customer')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto, @Req() req: Request) {
    const customer = await this.customersService.update(+id, updateCustomerDto, req['user']);
    return { status: 200, message: 'Client mis à jour avec succès', response: customer };
  }

  @Audit('DELETE', 'Customer')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const result = await this.customersService.remove(+id, req['user']);
    return { status: 200, message: 'Client supprimé avec succès', response: result };
  }
}
