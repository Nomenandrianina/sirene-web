import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Village } from '../villages/entities/village.entity';
import { Weather } from '../weathers/entities/weather.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Village)
    private readonly villageRepo: Repository<Village>,

    @InjectRepository(Weather)
    private readonly weatherRepo: Repository<Weather>,
  ) {}

  async exportSingleVillage(
    villageId: number,
    format: string = 'xlsx',
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    // ── 1. Charger le village ──
    const village = await this.villageRepo.findOne({ where: { id: villageId } });
    if (!village) throw new NotFoundException(`Village #${villageId} introuvable`);

    // ── 2. Charger les weathers filtrés par date ──
    const where: any = { village_id: villageId };
    if (startDate && endDate) {
      where.created_at = Between(new Date(startDate), new Date(endDate + 'T23:59:59'));
    } else if (startDate) {
      where.created_at = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.created_at = LessThanOrEqual(new Date(endDate + 'T23:59:59'));
    }

    const weathers = await this.weatherRepo.find({
      where,
      order: { created_at: 'DESC' },
    });

    // ── 3. Extraire tous les final_weather ──
    const finalWeathers: any[] = [];
    for (const w of weathers) {
      const fw = w.final_weather;
      if (Array.isArray(fw)) {
        finalWeathers.push(...fw);
      }
    }

    // ── 4. Extraire les date+period uniques (triées) ──
    const dateTimeMap: Record<string, Record<string, boolean>> = {};
    for (const fw of finalWeathers) {
      if (fw?.date && fw?.day_part) {
        if (!dateTimeMap[fw.date]) dateTimeMap[fw.date] = {};
        dateTimeMap[fw.date][fw.day_part] = true;
      }
    }
    // Trier par date décroissante comme Laravel
    const sortedDates = Object.keys(dateTimeMap).sort((a, b) => b.localeCompare(a));

    // ── 5. Helper : récupérer une valeur ──
    const getValue = (date: string, time: string, type: string): string => {
      const entry = finalWeathers.find(
        fw => fw.date === date && fw.day_part === time && fw.type === type,
      );
      return entry?.result != null ? String(entry.result) : '';
    };

    // ── 6. Construire les lignes ──
    type Row = string[];
    const headers: Row = [
      "Date d'envoi", "Village", "Plage horaire",
      "Vitesse du vent (en Km/h)", "Direction du vent",
      "Hauteur du vague (en m)", "Code couleur", "Alerte", "Message",
    ];

    const rows: Row[] = [headers];
    for (const date of sortedDates) {
      for (const time of Object.keys(dateTimeMap[date])) {
        rows.push([
          date,
          village.name,
          time,
          getValue(date, time, 'WINDSPD'),
          getValue(date, time, 'WINDIRNAME'),
          getValue(date, time, 'WVHGT'),
          getValue(date, time, 'COLOR'),
          getValue(date, time, 'ALERT'),
          '', // Message notification — à compléter si besoin
        ]);
      }
    }

    // ── 7. Générer le fichier ──
    if (format === 'csv') {
      return this.generateCsv(rows);
    }
    return this.generateXlsx(rows, village.name);
  }

  // ── CSV ──
  private generateCsv(rows: string[][]): Buffer {
    const csv = rows
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    return Buffer.from('\uFEFF' + csv, 'utf-8'); // BOM pour Excel
  }

  // ── XLSX avec ExcelJS (styles, merge, gras) ──
  private async generateXlsx(rows: string[][], villageName: string): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Prévisions');

    // En-tête gras
    rows.forEach((row, i) => {
      const wsRow = ws.addRow(row);
      if (i === 0) {
        wsRow.font = { bold: true };
        wsRow.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: 'FFD9E1F2' },
        };
      }
    });

    // Largeurs auto
    ws.columns.forEach(col => { col.width = 22; });

    // Merge colonne A (date) quand même date consécutive
    let mergeStart = 2; // ligne 1 = header
    for (let i = 2; i <= rows.length; i++) {
      const curr = rows[i - 1]?.[0];
      const next = rows[i]?.[0];
      if (curr !== next) {
        if (i - 1 > mergeStart - 1) {
          ws.mergeCells(`A${mergeStart}:A${i}`);
          const cell = ws.getCell(`A${mergeStart}`);
          cell.alignment = { vertical: 'middle' };
        }
        mergeStart = i + 1;
      }
    }

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}