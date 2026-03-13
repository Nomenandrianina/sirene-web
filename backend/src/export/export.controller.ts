import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';

@Controller()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * GET /export-single-village/:villageId
   * ?format=xlsx
   * &date[start_date]=2026-02-01
   * &date[end_date]=2026-03-10
   */
  @Get('export-single-village/:villageId')
  async exportSingleVillage(
    @Param('villageId', ParseIntPipe) villageId: number,
    @Query('format') format: string = 'xlsx',
    @Query('date') date: { start_date?: string; end_date?: string } = {},
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportSingleVillage(
      villageId,
      format,
      date.start_date,
      date.end_date,
    );

    const mimeType = format === 'csv'
      ? 'text/csv; charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="prevision.${format}"`);
    res.send(buffer);
  }
}