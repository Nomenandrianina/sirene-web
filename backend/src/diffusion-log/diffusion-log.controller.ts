import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiffusionLog } from './entities/diffusion-log.entity';

@Controller('diffusion-logs')
export class DiffusionLogController {
  constructor(
    @InjectRepository(DiffusionLog)
    private readonly repo: Repository<DiffusionLog>,
  ) {}

  /**
   * GET /diffusion-logs?souscriptionId=1
   * Historique des envois d'une souscription
   */
  @Get()
  findAll(@Query('souscriptionId') souscriptionId?: string) {
    const where: any = {};
    if (souscriptionId) where.souscriptionId = Number(souscriptionId);
    return this.repo.find({
      where,
      relations: ['souscription', 'souscription.packType'],
      order: { scheduledAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * GET /diffusion-logs/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['souscription'],
    });
  }
}