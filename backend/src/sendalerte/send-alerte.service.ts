import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Sirene } from "@/sirene/entities/sirene.entity";
import { Village }             from "@/villages/entities/village.entity";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";
import { AlerteAudio } from "@/alerte-audio/entities/alerte-audio.entity";
import { Notification, NotificationStatus } from "@/notification/entities/notification.entity";
import { SmsService }          from "@/services/sms.service";
import { SendAlerteDto }       from "./dto/send-alerte.dto";
@Injectable()
export class SendAlerteService {
  private readonly logger = new Logger(SendAlerteService.name);
 
  constructor(
    @InjectRepository(Sirene)              private readonly sireneRepo: Repository<Sirene>,
    @InjectRepository(Village)             private readonly villageRepo: Repository<Village>,
    @InjectRepository(SousCategorieAlerte) private readonly sousCatRepo: Repository<SousCategorieAlerte>,
    @InjectRepository(AlerteAudio)         private readonly audioRepo: Repository<AlerteAudio>,
    @InjectRepository(Notification)        private readonly notifRepo: Repository<Notification>,
    private readonly smsService: SmsService,
  ) {}
 
  async sendAlerte(dto: SendAlerteDto): Promise<{ created: number; sent: number; planned: number }> {
    const { sousCategorieAlerteId, provinceIds, regionIds, districtIds, sendingTimeAfterAlerte, userId } = dto;
 
    // 1. Vérifier que la sous-catégorie existe
    const sousCat = await this.sousCatRepo.findOne({ where: { id: sousCategorieAlerteId } });
    if (!sousCat) throw new NotFoundException(`SousCategorieAlerte #${sousCategorieAlerteId} introuvable`);
 
    // 2. Récupérer l'audio lié à cette sous-catégorie
    const audio = await this.audioRepo.findOne({ where: { sousCategorieAlerteId } });
 
    // 3. Trouver les villages selon les zones sélectionnées
    const villageQb = this.villageRepo
      .createQueryBuilder("v")
      .leftJoin("v.district", "d")
      .leftJoin("d.region", "r")
      .leftJoin("r.province", "p")
      .select("v.id");
 
    const hasZoneFilter = !!(provinceIds?.length || regionIds?.length || districtIds?.length);
    if (hasZoneFilter) {
      const conditions: string[] = [];
      if (provinceIds?.length)  conditions.push("p.id IN (:...provinceIds)");
      if (regionIds?.length)    conditions.push("r.id IN (:...regionIds)");
      if (districtIds?.length)  conditions.push("d.id IN (:...districtIds)");
      villageQb.where(conditions.join(" OR "), { provinceIds, regionIds, districtIds });
    }
 
    const villages   = await villageQb.getMany();
    const villageIds = villages.map(v => v.id);
 
    // 4. Trouver les sirènes actives dans ces villages
    const sireneQb = this.sireneRepo
      .createQueryBuilder("s")
      .where("s.isActive = true");
 
    if (hasZoneFilter && villageIds.length) {
      sireneQb.andWhere("s.villageId IN (:...villageIds)", { villageIds });
    } else if (hasZoneFilter && !villageIds.length) {
      return { created: 0, sent: 0, planned: 0 };
    }
 
    const sirenes = await sireneQb.getMany();
    if (!sirenes.length) {
      throw new BadRequestException("Aucune sirène active trouvée dans les zones sélectionnées");
    }
 
    // 5. Le message = mobileId de l'audio (ou fallback)
    const message  = audio?.mobileId ?? `ALERTE_${sousCategorieAlerteId}`;
    const isNow    = !sendingTimeAfterAlerte;
    const planDate = sendingTimeAfterAlerte ? new Date(sendingTimeAfterAlerte) : null;
 
    let sent = 0, planned = 0;
 
    // 6. Créer une notification par sirène — une par une pour éviter l'ambiguïté de create()
    for (const sirene of sirenes) {
      // Construire l'objet manuellement pour éviter la surcharge create([])
      const notif = new Notification();
      notif.message               = message;
      notif.sireneId              = sirene.id;
      notif.sousCategorieAlerteId = sousCategorieAlerteId;
      notif.alerteAudioId         = audio?.id ?? null;
      notif.phoneNumber           = sirene.phoneNumberBrain;
      notif.operator              = "Orange";
      notif.type                  = sousCat.name;
      notif.userId                = userId ?? null;
      notif.status                = NotificationStatus.PENDING;
      notif.sendingTimeAfterAlerte = planDate ?? null;
      notif.sendingTime           = isNow ? new Date() : null;
 
      // save() sur un objet unique retourne bien un Notification (pas un tableau)
      const saved: Notification = await this.notifRepo.save(notif);
 
      if (isNow) {
        await this.dispatchSms(saved);
        sent++;
      } else {
        planned++;
      }
    }
 
    return { created: sirenes.length, sent, planned };
  }
 
  async dispatchSms(notif: Notification): Promise<void> {
    if (!notif.phoneNumber) {
      this.logger.warn(`Notification #${notif.id} ignorée — numéro de téléphone manquant`);
      await this.notifRepo.update(notif.id, { status: NotificationStatus.FAILED, observation: "Numéro de téléphone manquant" });
      return;
    }
    try {
      const response = await this.smsService.sendSms(notif.phoneNumber, notif.message);
 
      const resourceURL: string = response?.outboundSMSMessageRequest?.resourceURL ?? "";
      const messageId: string | undefined = resourceURL ? resourceURL.split("/").pop() : undefined;
 
      await this.notifRepo.update(notif.id, {
        status:         NotificationStatus.SENT,
        messageId: messageId ?? undefined,
        sendingTime:    new Date(),
        operatorStatus: "sent",
      });
    } catch (err: any) {
      this.logger.error(`SMS failed for notification #${notif.id} → ${notif.phoneNumber}: ${err.message}`);
      await this.notifRepo.update(notif.id, {
        status:      NotificationStatus.FAILED,
        observation: (err.message as string)?.slice(0, 255),
      });
    }
  }
 
  @Cron(CronExpression.EVERY_MINUTE)
  async processPlannedNotifications(): Promise<void> {
    const now = new Date();
 
    const pending: Notification[] = await this.notifRepo
      .createQueryBuilder("n")
      .where("n.status = :status", { status: NotificationStatus.PENDING })
      .andWhere("n.sendingTimeAfterAlerte IS NOT NULL")
      .andWhere("n.sendingTimeAfterAlerte <= :now", { now })
      .andWhere("n.sendingTime IS NULL")
      .getMany();
 
    if (!pending.length) return;
 
    this.logger.log(`Cron: ${pending.length} notification(s) planifiée(s) à envoyer`);
 
    for (const notif of pending) {
      await this.dispatchSms(notif);
    }
  }
 
  async preview(dto: Partial<SendAlerteDto>): Promise<{ sireneCount: number; sirenes: any[] }> {
    const { provinceIds, regionIds, districtIds } = dto;
    const hasZoneFilter = !!(provinceIds?.length || regionIds?.length || districtIds?.length);
 
    const villageQb = this.villageRepo
      .createQueryBuilder("v")
      .leftJoin("v.district", "d")
      .leftJoin("d.region", "r")
      .leftJoin("r.province", "p")
      .select("v.id");
 
    if (hasZoneFilter) {
      const conditions: string[] = [];
      if (provinceIds?.length)  conditions.push("p.id IN (:...provinceIds)");
      if (regionIds?.length)    conditions.push("r.id IN (:...regionIds)");
      if (districtIds?.length)  conditions.push("d.id IN (:...districtIds)");
      villageQb.where(conditions.join(" OR "), { provinceIds, regionIds, districtIds });
    }
 
    const villages   = await villageQb.getMany();
    const villageIds = villages.map(v => v.id);
 
    const sireneQb = this.sireneRepo
      .createQueryBuilder("s")
      .leftJoin("s.village", "v")
      .addSelect(["s.id", "s.imei", "s.phoneNumberBrain", "v.name"])
      .where("s.isActive = true");
 
    if (hasZoneFilter && villageIds.length) {
      sireneQb.andWhere("s.villageId IN (:...villageIds)", { villageIds });
    } else if (hasZoneFilter && !villageIds.length) {
      return { sireneCount: 0, sirenes: [] };
    }
 
    const sirenes = await sireneQb.getMany();
    return { sireneCount: sirenes.length, sirenes };
  }
}
 