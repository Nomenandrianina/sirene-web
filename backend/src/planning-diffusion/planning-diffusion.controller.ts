import {
  Controller, Get, Post, Patch, Param, Query,
  ParseIntPipe, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { DiffusionPlanifieeService } from '@/diffusion-planifiee/diffusion-planifiee.service';
import { DiffusionSchedulerService } from '@/diffusion-scheduler/diffusion-scheduler.service';

function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

/** Lundi de la semaine contenant `d` */
function getMondayOf(d: Date): Date {
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

@Controller('planning-diffusion')
export class PlanningDiffusionController {
  constructor(
    private readonly planifieeService: DiffusionPlanifieeService,
    private readonly schedulerService: DiffusionSchedulerService,
  ) {}

  // ── Vue planning ───────────────────────────────────────────────────────────
  @Get()
  getPlanning(
    @Query('from')           from?:           string,
    @Query('to')             to?:             string,
    @Query('customerId')     customerId?:     string,
    @Query('souscriptionId') souscriptionId?: string,
    @Query('sireneId')       sireneId?:       string,
  ) {
    const monday = getMondayOf(new Date());
    const resolvedFrom = from ?? toDateStr(monday);
    const resolvedTo   = to   ?? toDateStr(addDays(monday, 6));

    return this.planifieeService.getPlanning({
      from:           resolvedFrom,
      to:             resolvedTo,
      customerId:     customerId     ? Number(customerId)     : undefined,
      souscriptionId: souscriptionId ? Number(souscriptionId) : undefined,
      sireneId:       sireneId       ? Number(sireneId)       : undefined,
    });
  }

  /**
   * GET /planning-diffusion/stats
   *
   * Compteurs pour la semaine (ou plage) : planned / sent / cancelled / skipped
   */
  @Get('stats')
  getStats(
    @Query('from')       from?:       string,
    @Query('to')         to?:         string,
    @Query('customerId') customerId?: string,
  ) {
    const monday = getMondayOf(new Date());
    return this.planifieeService.getWeekStats(
      from ?? toDateStr(monday),
      to   ?? toDateStr(addDays(monday, 6)),
      customerId ? Number(customerId) : undefined,
    );
  }

  /**
   * GET /planning-diffusion/:id
   * Détail d'une diffusion planifiée
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planifieeService.findOne(id);
  }

  // ── Annulation ─────────────────────────────────────────────────────────────

  /**
   * PATCH /planning-diffusion/:id/cancel
   * Body : { cancelledBy: number }
   */
  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id:          number,
    @Body('cancelledBy')        cancelledBy: number,
  ) {
    return this.planifieeService.cancel(id, cancelledBy);
  }

  // ── Déclenchement manuel (TEST) ────────────────────────────────────────────

  /**
   * POST /planning-diffusion/trigger/:date
   *
   * Déclenche manuellement l'envoi des diffusions d'une date précise.
   * Simule exactement ce que fait le cron à 3h du matin.
   *
   * :date  →  "2026-04-15"  (ou "today" pour aujourd'hui, "tomorrow" pour demain)
   *
   * Exemples :
   *   POST /planning-diffusion/trigger/today
   *   POST /planning-diffusion/trigger/tomorrow
   *   POST /planning-diffusion/trigger/2026-04-15
   */
  @Post('trigger/:date')
  @HttpCode(HttpStatus.OK)
  async triggerDate(@Param('date') date: string) {
    let dateStr: string;
    

    if (date === 'today') {
      dateStr = toDateStr(new Date());
    } else if (date === 'tomorrow') {
      dateStr = toDateStr(addDays(new Date(), 1));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      dateStr = date;
    } else {
      return { error: `Format de date invalide : "${date}". Utilisez YYYY-MM-DD, "today" ou "tomorrow"` };
    }
    console.log('[trigger] dateStr =', dateStr, '| new Date() =', new Date().toISOString());

    const result = await this.schedulerService.processDiffusionsForDate(dateStr,null);
    return result;
  }

  /**
   * POST /planning-diffusion/regenerate/:souscriptionId
   *
   * Regénère le planning d'une souscription (utile si le pack ou les sirènes changent).
   * Annule d'abord les lignes PLANNED futures, puis recrée.
   */
  @Post('regenerate/:souscriptionId')
  @HttpCode(HttpStatus.OK)
  async regenerate(@Param('souscriptionId', ParseIntPipe) souscriptionId: number) {
    // Annuler les futures
    const cancelled = await this.planifieeService.cancelBySouscription(
      souscriptionId,
      'Regénération du planning demandée',
    );

    // TODO : récupérer la souscription et appeler generateForSouscription()
    // La souscription doit être rechargée avec ses relations
    // await this.planifieeService.generateForSouscription(souscription);

    return {
      message:   `Planning regénéré pour la souscription #${souscriptionId}`,
      cancelled,
    };
  }
}