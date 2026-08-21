import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, Request,HttpCode ,HttpStatus, NotFoundException, InternalServerErrorException, UseGuards, BadRequestException} from '@nestjs/common';
import { SirenesService }   from './sirene.service';
import { CreateSireneDto }  from './dto/create-sirene.dto';
import { UpdateSireneDto }  from './dto/update-sirene.dto';
import { SmsService } from '@/sms/sms.service';
import { Public } from 'src/common/decarators/public.decorator';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { ROLES } from 'src/common/constants/roles.constants';
import { RegisterSireneDto } from './dto/register-sirene.dto';

class SendAlertDto {
  message: string;
}


@Controller('sirenes')
export class SirenesController {
  constructor(private readonly sirenesService: SirenesService,private readonly smsService: SmsService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async registerSirene(@Body() dto: RegisterSireneDto ): Promise<{ created: boolean; sireneId: number }> {
    return this.sirenesService.registerOrUpdateSirene(dto.imei, dto.fcmToken);
  }
  
  @Get('all')
  findAllNoFilter() {
    return this.sirenesService.findAllWithoutfilter();
  }

  @Get()
  findAll(@Request() req) {
    const user = req.user;
    const roleName = user.role?.name?.toUpperCase();
    const isSuperAdmin = roleName === ROLES.SUPERADMIN;
    const customerId   = user.customerId ?? user.customer?.id;
    return this.sirenesService.findAll(isSuperAdmin, customerId);
  }

  @Get('getallformap')
  findAllForMap(@Request() req) {
    const user     = req.user;
    const roleName = user.role?.name?.toUpperCase();
    
    const isGlobalViewer = roleName === ROLES.SUPERADMIN || roleName === ROLES.BNGRC_ALERTE;
    const customerId     = user.customerId ?? user.customer?.id;
    
    return this.sirenesService.findAllForMap(isGlobalViewer, customerId);
  }

  @Get('by-customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    const id = parseInt(customerId.trim(), 10);
    if (isNaN(id)) throw new BadRequestException('customerId must be a number');
    return this.sirenesService.findByCustomer(id);
  }
  
  @Get('messageavailable')
  getmessageavalaible(@Request() req) {
    return this.smsService.getAdminContracts();
  }
  

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sirenesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSireneDto, @Request() req) {
    return this.sirenesService.create(dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSireneDto,
    @Request() req,
  ) {
    return this.sirenesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.sirenesService.remove(id, req.user.id);
  } 

  @Public()
  @UseGuards(ApiKeyGuard) 
  @Post('fcm-token/:imei')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateFcmToken(@Param('imei') imei: string, @Body() dto: UpdateSireneDto, ): Promise<void> {
  try {
    console.log("imei :",imei)
    await this.sirenesService.updateFcmToken(imei, dto.fcmToken as string);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Erreur lors de la mise à jour du token FCM');
    }
  }

}