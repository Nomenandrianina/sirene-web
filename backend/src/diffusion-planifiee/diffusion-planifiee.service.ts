import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import {DiffusionPlanifiee, DiffusionPlanifieeStatus,} from './entities/diffusion-planifiee.entity';
import { Souscription } from '@/souscription/entities/souscription.entity';
import { PackType } from '@/packtype/entities/packtype.entity';
import { DiffusionConfig } from 'src/diffusion-config/entities/diffusion-config.entity';
// ── Helpers date ──────────────────────────────────────────────────────────────

/** "2026-04-15" */
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Jour ISO 1=lundi … 7=dimanche */
function isoDay(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

/** Créneaux autorisés selon frequenceParJour */
const CRENEAUX_BASE = [7, 12, 16];
interface CreneauResolu { heure: number; minute: number; }

function creneauxDuPack(pack: PackType): CreneauResolu[] {
  // Si le pack a des créneaux configurés → on les utilise
  if (pack.creneaux?.length) {
    return pack.creneaux; // [{ heure: 7, minute: 0 }, { heure: 16, minute: 15 }]
  }
  // Fallback legacy pour les anciens packs sans créneaux configurés
  return [7, 12, 16]
    .slice(0, pack.frequenceParJour)
    .map(h => ({ heure: h, minute: 0 }));
}
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class DiffusionPlanifieeService {
  private readonly logger = new Logger(DiffusionPlanifieeService.name);

  constructor(
    @InjectRepository(DiffusionPlanifiee)
    private readonly repo: Repository<DiffusionPlanifiee>,

    @InjectRepository(DiffusionConfig)          // ← ajouter
    private readonly diffusionConfigRepo: Repository<DiffusionConfig>,
  ) {}

  // ── GÉNÉRATION ──────────────────────────────────────────────────────────────

  /**
   * Appelé juste après la création d'une souscription.
   * Génère toutes les lignes DiffusionPlanifiee pour toute la période.
   *
   * Exemple : pack premium (3 créneaux) × 2 sirènes × 30 jours = 180 lignes
   */
  async generateForSouscription(souscription: Souscription): Promise<number> {
    const pack    = souscription.packType;
    const sirenes = souscription.sirenes ?? [];
  
    if (!sirenes.length) {
      this.logger.warn(`Souscription #${souscription.id} — aucune sirène, planning non généré`);
      return 0;
    }
  
    const creneaux  = creneauxDuPack(pack);   // ← maintenant { heure, minute }[]
    const startDate = new Date(souscription.startDate);
    const endDate   = new Date(souscription.endDate);
    const rows: Partial<DiffusionPlanifiee>[] = [];
  
    let cursor = new Date(startDate);
    while (cursor <= endDate) {
      const jourISO = isoDay(cursor);
      const dateStr = toDateStr(cursor);
  
      const jourAutorise =
        !pack.joursAutorises?.length ||
        pack.joursAutorises.includes(jourISO);
  
      if (jourAutorise) {
        for (const sirene of sirenes) {
          for (const creneau of creneaux) {
            rows.push({
              souscriptionId: souscription.id,
              customerId:     souscription.customerId,
              sireneId:       sirene.id,
              scheduledDate:  dateStr,
              scheduledHeure:  creneau.heure,    // ← heure dynamique
              scheduledMinute: creneau.minute,   // ← minute dynamique
              status:         DiffusionPlanifieeStatus.PLANNED,
            });
          }
        }
      }
  
      cursor = addDays(cursor, 1);
    }
  
    if (!rows.length) {
      this.logger.warn(`Souscription #${souscription.id} — aucune ligne générée`);
      return 0;
    }
  
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      await this.repo.insert(rows.slice(i, i + BATCH));
    }
  
    this.logger.log(
      `Souscription #${souscription.id} — ${rows.length} diffusions planifiées générées`,
    );
    return rows.length;
  }

  // ── LECTURE PLANNING ────────────────────────────────────────────────────────

  /**
   * Retourne les diffusions d'une plage de dates, organisées par date + heure.
   * Utilisé par la vue planning hebdomadaire.
   */
  async getPlanning(query: {
    from:            string;
    to:              string;
    customerId?:     number;
    souscriptionId?: number;
    sireneId?:       number;
  }): Promise<PlanningSlot[]> {
   
    const qb = this.repo
      .createQueryBuilder('dp')
   
      // ── Sirène ──────────────────────────────────────────────────────────────
      .leftJoin('sirene', 's', 's.id = dp.sirene_id')
      .addSelect(['s.id', 's.name'])
   
      // ── Notification ────────────────────────────────────────────────────────
      .leftJoin('notification_sirene_alerte', 'n', 'n.id = dp.notification_id')
      .addSelect(['n.id', 'n.status', 'n.message'])
   
      // ── Souscription → alerte_audio ─────────────────────────────────────────
      // dp.souscription_id → souscription.alerte_audio_id → alerte_audio
      .leftJoin(
        'alerte_audio',
        'aa',
        'aa.sirene_id = dp.sirene_id AND aa.customer_id = dp.customer_id'
      )
   
      // ── alerte_audio → sous_categorie_alerte ────────────────────────────────
      .leftJoin('sous_categorie_alerte', 'sca', 'sca.id = aa.sous_categorie_alerte_id')
      .addSelect(['sca.id', 'sca.name'])
   
      // ── Customer ─────────────────────────────────────────────────────────────
      .leftJoin('customers', 'cu', 'cu.id = dp.customer_id')
      .addSelect(['cu.id', 'cu.name'])
   
      .where('dp.scheduled_date BETWEEN :from AND :to', {
        from: query.from,
        to:   query.to,
      })
      .orderBy('dp.scheduled_date', 'ASC')
      .addOrderBy('dp.scheduled_heure', 'ASC');
   
    if (query.customerId)     qb.andWhere('dp.customer_id = :cid',       { cid:  query.customerId });
    if (query.souscriptionId) qb.andWhere('dp.souscription_id = :sid',   { sid:  query.souscriptionId });
    if (query.sireneId)       qb.andWhere('dp.sirene_id = :sid2',         { sid2: query.sireneId });
   
    const { entities, raw } = await qb.getRawAndEntities();
   
    const map = new Map<string, PlanningSlot>();
    const now = new Date();
   
    for (const dp of entities) {
      const key = `${dp.scheduledDate}-${dp.scheduledHeure}`;
      if (!map.has(key)) {
        map.set(key, {
          date:  dp.scheduledDate,
          heure: dp.scheduledHeure as 7 | 12 | 16,
          items: [],
        });
      }
   
      const scheduledDateTime = new Date(
        `${dp.scheduledDate}T${String(dp.scheduledHeure).padStart(2, '0')}:00:00`,
      );
      const canCancel =
        dp.status === DiffusionPlanifieeStatus.PLANNED &&
        scheduledDateTime > now;
   
      const r = raw.find((x: any) => x.dp_id === dp.id) ?? {};
   
      map.get(key)!.items.push({
        id:               dp.id,
        souscriptionId:   dp.souscriptionId,
        sireneId:         dp.sireneId,
        sireneName:       r['s_name']   ?? null,
        scheduledDate:    dp.scheduledDate,
        scheduledHeure:   dp.scheduledHeure,
        status:           dp.status,
        observation:      dp.observation,
        notificationId:   dp.notificationId,
        notifStatus:      r['n_status'] ?? null,
        notifMessage:     r['n_message'] ?? null,
        canCancel,
        // ── Nouveaux ───────────────────────────────────────────────────────────
        customerName:     r['cu_name']  ?? null,
        customerId:       r['cu_id']    ?? null,
        sousCategorieId:  r['sca_id']   ?? null,
        sousCategorieNom: r['sca_name'] ?? null,
        alerteAudioId:    r['aa_id']    ?? null,
        alerteAudioName:  r['aa_name']  ?? null,
      });
    }
   
    return Array.from(map.values());
  }
 
  
  // async getPlanning(query: {
  //   from: string;
  //   to: string;
  //   customerId?: number;
  //   souscriptionId?: number;
  //   sireneId?: number;
  // }): Promise<PlanningSlot[]> {
  //   const qb = this.repo
  //     .createQueryBuilder('dp')
  //     .leftJoin('sirene', 's', 's.id = dp.sirene_id')
  //     .addSelect(['s.id', 's.name', 's.phone_number_brain'])
  //     .leftJoin(
  //       'notification_sirene_alerte', 'n',
  //       'n.id = dp.notification_id',
  //     )
  //     .addSelect(['n.id', 'n.status', 'n.message', 'n.message_id'])
  //     .where('dp.scheduled_date BETWEEN :from AND :to', {
  //       from: query.from,
  //       to:   query.to,
  //     })
  //     .orderBy('dp.scheduled_date', 'ASC')
  //     .addOrderBy('dp.scheduled_heure', 'ASC');

  //   if (query.customerId)    qb.andWhere('dp.customer_id = :cid',  { cid: query.customerId });
  //   if (query.souscriptionId) qb.andWhere('dp.souscription_id = :sid', { sid: query.souscriptionId });
  //   if (query.sireneId)      qb.andWhere('dp.sirene_id = :sid2', { sid2: query.sireneId });

  //   const rows = await qb.getRawAndEntities();

  //   // Organiser par date + heure
  //   const map = new Map<string, PlanningSlot>();
  //   const now = new Date();

  //   for (const dp of rows.entities) {
  //     const key = `${dp.scheduledDate}-${dp.scheduledHeure}`;
  //     if (!map.has(key)) {
  //       map.set(key, {
  //         date:  dp.scheduledDate,
  //         heure: dp.scheduledHeure as 7 | 12 | 16,
  //         items: [],
  //       });
  //     }

  //     // Heure de déclenchement prévue pour l'annulabilité
  //     const scheduledDateTime = new Date(`${dp.scheduledDate}T${String(dp.scheduledHeure).padStart(2,'0')}:00:00`);
  //     const canCancel =
  //       dp.status === DiffusionPlanifieeStatus.PLANNED &&
  //       scheduledDateTime > now;

  //     // Récupérer les champs raw de la jointure
  //     const raw = rows.raw.find((r: any) => r.dp_id === dp.id) ?? {};

  //     map.get(key)!.items.push({
  //       id:             dp.id,
  //       souscriptionId: dp.souscriptionId,
  //       sireneId:       dp.sireneId,
  //       sireneName:     raw['s_name'] ?? null,
  //       scheduledDate:  dp.scheduledDate,
  //       scheduledHeure: dp.scheduledHeure,
  //       status:         dp.status,
  //       observation:    dp.observation,
  //       notificationId: dp.notificationId,
  //       notifStatus:    raw['n_status'] ?? null,
  //       notifMessage:   raw['n_message'] ?? null,
  //       canCancel,
  //     });
  //   }

  //   return Array.from(map.values());
  // }

  /**
   * Résumé stats pour une semaine
   */
  async getWeekStats(from: string, to: string, customerId?: number): Promise<WeekStats> {
    const qb = this.repo
      .createQueryBuilder('dp')
      .where('dp.scheduled_date BETWEEN :from AND :to', { from, to })
      .select('dp.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dp.status');

    if (customerId) qb.andWhere('dp.customer_id = :cid', { cid: customerId });

    const raw: { status: string; count: string }[] = await qb.getRawMany();
    const counts = Object.fromEntries(raw.map((r) => [r.status, Number(r.count)]));

    return {
      planned:   counts['planned']   ?? 0,
      sent:      counts['sent']      ?? 0,
      cancelled: counts['cancelled'] ?? 0,
      skipped:   counts['skipped']   ?? 0,
      total:     raw.reduce((s, r) => s + Number(r.count), 0),
    };
  }

  // ── CRON — lignes du jour ───────────────────────────────────────────────────

  /**
   * Utilisé par le cron 3h : retourne toutes les lignes PLANNED du jour J+1
   * (le cron envoie la veille pour le lendemain)
   * Inclut la relation sirene pour récupérer phoneNumberBrain
   */
  async findPlannedForDate(
    dateStr:  string,
    regionId: number | null = null,
  ): Promise<DiffusionPlanifiee[]> {
  
    const qb = this.repo
      .createQueryBuilder('dp')
      .where('dp.scheduled_date = :date', { date: dateStr })
      .andWhere('dp.status = :status', { status: DiffusionPlanifieeStatus.PLANNED })
      .orderBy('dp.sirene_id',          'ASC')
      .addOrderBy('dp.scheduled_heure', 'ASC');
  
    // Filtre régional uniquement si regionId est fourni
    if (regionId !== null) {
      qb
        .innerJoin('dp.sirene',   's')
        .innerJoin('s.village',   'v')
        .innerJoin('v.fokontany', 'fk')
        .innerJoin('fk.commune',  'co')
        .innerJoin('co.district', 'di')
        .andWhere('di.regionId = :regionId', { regionId });
    }
    // Si regionId === null → config globale, on prend TOUT sans filtrer par région
  
    return qb.getMany();
  }
  

  // ── ANNULATION ──────────────────────────────────────────────────────────────

  async cancel(id: number, cancelledBy: number): Promise<void> {
    const dp = await this.repo.findOne({ where: { id } });
    if (!dp) throw new NotFoundException(`DiffusionPlanifiee #${id} introuvable`);

    if (dp.status !== DiffusionPlanifieeStatus.PLANNED) {
      throw new BadRequestException(
        `Impossible d'annuler une diffusion avec le statut "${dp.status}"`,
      );
    }

    const scheduledDT = new Date(
      `${dp.scheduledDate}T${String(dp.scheduledHeure).padStart(2,'0')}:00:00`,
    );
    if (scheduledDT <= new Date()) {
      throw new BadRequestException('Cette diffusion est déjà passée — annulation impossible');
    }

    await this.repo.update(id, {
      status:      DiffusionPlanifieeStatus.CANCELLED,
      observation: `Annulé par user #${cancelledBy} le ${new Date().toLocaleString('fr-FR')}`,
    });
  }

  /** Annuler toutes les diffusions futures d'une souscription (ex: suspension) */
  async cancelBySouscription(souscriptionId: number, reason: string): Promise<number> {
    const today = toDateStr(new Date());
    const result = await this.repo
      .createQueryBuilder()
      .update(DiffusionPlanifiee)
      .set({ status: DiffusionPlanifieeStatus.CANCELLED, observation: reason })
      .where('souscription_id = :sid', { sid: souscriptionId })
      .andWhere('status = :s', { s: DiffusionPlanifieeStatus.PLANNED })
      .andWhere('scheduled_date >= :today', { today })
      .execute();
    return result.affected ?? 0;
  }

  /** Marquer comme envoyé après le cron */
  async markSent(id: number, notificationId: number): Promise<void> {
    await this.repo.update(id, {
      status: DiffusionPlanifieeStatus.SENT,
      notificationId,
    });
  }

  /** Marquer comme skipped (pas d'audio au moment du cron) */
  async markSkipped(id: number, reason: string): Promise<void> {
    await this.repo.update(id, {
      status:      DiffusionPlanifieeStatus.SKIPPED,
      observation: reason,
    });
  }

  async findOne(id: number): Promise<DiffusionPlanifiee> {
    const dp = await this.repo.findOne({ where: { id } });
    if (!dp) throw new NotFoundException(`DiffusionPlanifiee #${id} introuvable`);
    return dp;
  }

  
}

// ── Types retournés au frontend ───────────────────────────────────────────────

export interface PlanningItem {
  id:             number;
  souscriptionId: number;
  sireneId:       number;
  sireneName:     string | null;
  scheduledDate:  string;
  scheduledHeure: number;
  status:         DiffusionPlanifieeStatus;
  observation:    string | null;
  notificationId: number | null;
  notifStatus:    string | null;
  notifMessage:   string | null;
  canCancel:      boolean;
  customerName:        string | null;   // customer.name
  customerId:          number | null;   // pour filtre côté frontend
  sousCategorieId:     number | null;   // sous_categorie_alerte.id
  sousCategorieNom:    string | null;   // sous_categorie_alerte.name
  alerteAudioId:       number | null;   // alerte_audio.id
  alerteAudioName:     string | null;   // alerte_audio.name

}

export interface PlanningSlot {
  date:  string;
  heure: 7 | 12 | 16;
  items: PlanningItem[];
}

export interface WeekStats {
  planned: number; sent: number; cancelled: number; skipped: number; total: number;
}