import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as fs   from 'fs';
import * as path from 'path';
import { AlerteAudio, AudioValidationStatus }          from './entities/alerte-audio.entity';
import { CreateAlerteAudioDto } from './dto/create-alerte-audio.dto';
import { UpdateAlerteAudioDto } from './dto/update-alerte-audio.dto';
import { SousCategorieAlerte }  from '@/sous-categorie-alerte/entities/sous-categorie-alerte.entity';
import { Sirene }               from '@/sirene/entities/sirene.entity';
import * as ffmpeg from 'fluent-ffmpeg';
// import * as mm from 'music-metadata';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { join } from "path";
import { NotificationswebService } from 'src/notificationsweb/notificationsweb.service';
import { User } from 'src/users/entities/user.entity';
import { Customer } from 'src/customers/entity/customer.entity';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

@Injectable()
export class AlerteAudioService {
  constructor(
    @InjectRepository(AlerteAudio)
    private readonly repo: Repository<AlerteAudio>,

    @InjectRepository(SousCategorieAlerte)
    private readonly sousCatRepo: Repository<SousCategorieAlerte>,

    @InjectRepository(Sirene)
    private readonly sireneRepo: Repository<Sirene>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

    private readonly notifService: NotificationswebService,

  ) {}

  // ── READ ALL ──────────────────────────────────────────────────────────────

  findAll(sousCategorieAlerteId?: number) {
    return this.repo.find({
      where: sousCategorieAlerteId ? { sousCategorieAlerteId } : {},
      relations: ['sirenes', 'sousCategorie', 'createdByUser', 'customer'], // ← ajout sirene
      order: { createdAt: 'DESC' },
    });
  }

 // alerte-audio.service.ts
async findAllbyCustomer(customerId?: number) {
  return this.repo.find({
    where:     customerId ? { customerId } : {},
    relations: ['sirenes', 'sousCategorie', 'createdByUser', 'customer'],
    order:     { createdAt: 'DESC' },
  });
}
  // ── READ ONE ──────────────────────────────────────────────────────────────

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['sirenes', 'sousCategorie', 'createdByUser', 'customer'], // ← ajout sirene
    });
    if (!item) throw new NotFoundException(`AlerteAudio #${id} introuvable`);
    return item;
  }

  // ── READ BY SIRENE ────────────────────────────────────────────────────────
  // ✅ NOUVEAU — pour la sync mobile : GET /alerte-audios/sirene/:imei

  findBySirene(sireneId: number) {
    return this.repo
      .createQueryBuilder('aa')
      .innerJoinAndSelect('aa.sirenes', 's')
      .leftJoinAndSelect('aa.sousCategorie', 'sc')
      .where('s.id = :sireneId', { sireneId })
      .andWhere('aa.deletedAt IS NULL')
      .orderBy('aa.createdAt', 'DESC')
      .getMany();
  }

  // ── USED SOUS-CATEGORIES ──────────────────────────────────────────────────
  // Préservé tel quel — retourne les ids de sous-catégories déjà utilisées
  async getUsedSousCategorieIds(): Promise<number[]> {
    const used = await this.repo.find({
      select: ['sousCategorieAlerteId'],
      withDeleted: false,
    });
    return [...new Set(used.map(a => a.sousCategorieAlerteId))];
  }

  // ✅ NOUVEAU — retourne les combinaisons (sousCat + sirène) déjà prises
  // Utile pour griser les options dans le formulaire frontend

  async getUsedCombinations(): Promise<{ sousCategorieAlerteId: number; sireneId: number }[]> {
    const rows = await this.repo
      .createQueryBuilder('aa')
      .innerJoin('aa.sirenes', 's')
      .select('aa.sousCategorieAlerteId', 'sousCategorieAlerteId')
      .addSelect('s.id', 'sireneId')
      .where('aa.deletedAt IS NULL')
      .getRawMany();
  
    return rows.map(r => ({
      sousCategorieAlerteId: Number(r.sousCategorieAlerteId),
      sireneId:              Number(r.sireneId),
    }));
  }

  // ── CREATE ────────────────────────────────────────────────────────────────
  // ✅ MODIFIÉ — crée un AlerteAudio par sirène sélectionnée
  //    Logique mobileId, préfixe ALT_/ANN_ et deleteFile : tous préservés

  async create( dto: CreateAlerteAudioDto, file: Express.Multer.File, currentUser: { id: number; role: { name: string } },): Promise<AlerteAudio[]> {
  
    const isSuperAdmin = currentUser.role?.name === 'superadmin';
  
    // 1. Parser sireneIds
    const rawIds = Array.isArray((dto as any).sireneIds)
      ? (dto as any).sireneIds
      : String((dto as any).sireneIds ?? '').split(',').filter(Boolean);
    const sireneIds = rawIds.map(Number).filter((n: number) => !isNaN(n) && n > 0);
  
    if (sireneIds.length === 0) {
      this.deleteFile(file.path);
      throw new BadRequestException('Au moins une sirène doit être sélectionnée');
    }
  
    // 2. Vérifier que toutes les sirènes existent
    const sirenes = await this.sireneRepo.find({ where: { id: In(sireneIds) } });
    if (sirenes.length !== sireneIds.length) {
      this.deleteFile(file.path);
      const foundIds = sirenes.map(s => s.id);
      const missing  = sireneIds.filter((id: number) => !foundIds.includes(id));
      throw new NotFoundException(`Sirène(s) introuvable(s) : ${missing.join(', ')}`);
    }
  
    // 2b. Mode client : créer la sous-catégorie à la volée
    if (dto.newSousCatName?.trim()) {
      if (!dto.categorieAlerteId) {
        this.deleteFile(file.path);
        throw new BadRequestException('categorieAlerteId requis pour créer une sous-catégorie');
      }
      if (!dto.alerteTypeId) {
        this.deleteFile(file.path);
        throw new BadRequestException('alerteTypeId requis pour créer une sous-catégorie');
      }
      if (!dto.alerteId) {
        this.deleteFile(file.path);
        throw new BadRequestException('alerteId requis pour créer une sous-catégorie');
      }
  
      const newSousCat = this.sousCatRepo.create({
        name:              dto.newSousCatName.trim(),
        categorieAlerteId: Number(dto.categorieAlerteId),
        alerteTypeId:      Number(dto.alerteTypeId),
        alerteId:          Number(dto.alerteId),
      });
      const saved = await this.sousCatRepo.save(newSousCat);
      (dto as any).sousCategorieAlerteId = saved.id;
    }
  
    // 3. Vérifier conflits — adapter pour ManyToMany
    const conflicts = await this.repo
      .createQueryBuilder('aa')
      .innerJoin('aa.sirenes', 's')
      .where('aa.sousCategorieAlerteId = :sousCatId', {
        sousCatId: Number(dto.sousCategorieAlerteId),
      })
      .andWhere('s.id IN (:...ids)', { ids: sireneIds })
      .andWhere('aa.deletedAt IS NULL')
      .getMany();
  
    if (conflicts.length > 0) {
      this.deleteFile(file.path);
      // Retrouver quelles sirènes sont en conflit pour le message d'erreur
      const conflictSireneIds = await this.repo
        .createQueryBuilder('aa')
        .innerJoin('aa.sirenes', 's')
        .select('s.id', 'sireneId')
        .addSelect('s.name', 'sireneName')
        .where('aa.sousCategorieAlerteId = :sousCatId', {
          sousCatId: Number(dto.sousCategorieAlerteId),
        })
        .andWhere('s.id IN (:...ids)', { ids: sireneIds })
        .andWhere('aa.deletedAt IS NULL')
        .getRawMany();
  
      const dups = conflictSireneIds.map(r => r.sireneName || `#${r.sireneId}`).join(', ');
      throw new ConflictException(
        `Un audio pour cette sous-catégorie existe déjà pour : ${dups}`,
      );
    }
  
    // 4. Charger la sous-catégorie pour générer le mobileId
    const sousCat = await this.sousCatRepo.findOne({
      where: { id: Number(dto.sousCategorieAlerteId) },
    });
  
    const baseName = (sousCat?.name ?? `sous_cat_${dto.sousCategorieAlerteId}`)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  
    let prefix = '';
    const alerteName = sousCat?.alerte?.name ?? '';
    if (alerteName.includes('Catastrophe') || alerteName.includes('Alerte'))            prefix = 'ALT_';
    if (alerteName.includes('Communication') || alerteName.includes('Sensibilisation')) prefix = 'ANN_';
  
    const fullPath = join(process.cwd(), file.path);
    const duree    = await this.getAudioDuration(fullPath);
  
    // 5. Créer UN SEUL audio avec toutes les sirènes
    const mobileId =
      dto.mobileId && dto.mobileId !== 'undefined' && dto.mobileId.trim()
        ? dto.mobileId.trim()
        : `${prefix}${baseName}_${Date.now()}`;  // ← plus de _S{sireneId} car mutualisé
  
    const audio                 = new AlerteAudio();
    audio.mobileId              = mobileId;
    audio.sousCategorieAlerteId = Number(dto.sousCategorieAlerteId);
    audio.sirenes               = sirenes;          // ← tableau de sirènes
    audio.name                  = dto.name        ?? null;
    audio.description           = dto.description ?? null;
    audio.audio                 = file.path;
    audio.originalFilename      = file.originalname;
    audio.fileSize              = file.size;
    audio.duration              = duree;
    audio.customerId            = dto.customerId ?? null;
    audio.createdByUserId       = currentUser.id;
    audio.status                = isSuperAdmin
      ? AudioValidationStatus.APPROVED
      : AudioValidationStatus.PENDING;
  
    const saved = await this.repo.save(audio);
  
    // 6. Notif après création — seulement si client
    if (!isSuperAdmin) {
      const creator = await this.userRepo.findOne({
        where:  { id: currentUser.id },
        select: ['id', 'first_name', 'last_name', 'email'],
      });
      const userName = [creator?.first_name, creator?.last_name]
        .filter(Boolean).join(' ') || creator?.email || 'Utilisateur';
  
      const customer = dto.customerId
        ? await this.customerRepo.findOne({
            where:  { id: dto.customerId },
            select: ['id', 'name'],
          })
        : null;
      const customerName = customer?.name || '';
  
      const superAdmins = await this.userRepo.find({
        where:     { role: { name: 'superadmin' } },
        relations: ['role'],
        select:    ['id'],
      });
      const adminIds = superAdmins.map(u => u.id);
  
      if (adminIds.length > 0) {
        const sireneCount = sirenes.length;
        await this.notifService.notifyMany(adminIds, {
          type:       'AUDIO_PENDING',
          message:    `Nouvel audio à valider : "${dto.name || 'Sans nom'}" (${sireneCount} sirène${sireneCount > 1 ? 's' : ''})||${userName}||${customerName}`,
          entityType: 'alerte_audio',
          entityId:   saved.id,
          url:        `/alerte-audios/${saved.id}/review`,
        });
      }
    }
  
    return [saved]; // ← retourne un tableau avec un seul élément
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  // Un seul enregistrement à la fois — logique inchangée sauf contrainte composite

  async update(id: number, dto: UpdateAlerteAudioDto, file?: Express.Multer.File) {
    const audio = await this.repo.findOne({
      where:     { id },
      relations: ['sirenes', 'sousCategorie'],
    });
    if (!audio) throw new NotFoundException(`Audio #${id} introuvable`);
  
    // Vérifier conflit si la sous-catégorie change
    if (dto.sousCategorieAlerteId && dto.sousCategorieAlerteId !== audio.sousCategorieAlerteId) {
      const currentSireneIds = audio.sirenes.map(s => s.id);
  
      if (currentSireneIds.length > 0) {
        const conflict = await this.repo
          .createQueryBuilder('aa')
          .innerJoin('aa.sirenes', 's')
          .where('aa.sousCategorieAlerteId = :sousCatId', {
            sousCatId: dto.sousCategorieAlerteId,
          })
          .andWhere('s.id IN (:...ids)', { ids: currentSireneIds })
          .andWhere('aa.id != :id', { id })           // exclure l'audio en cours
          .andWhere('aa.deletedAt IS NULL')
          .getOne();
  
        if (conflict) {
          if (file) this.deleteFile(file.path);
          throw new ConflictException(
            `Un audio existe déjà pour cette sous-catégorie et une ou plusieurs sirènes de cet audio`,
          );
        }
      }
    }
  
    // Mettre à jour les sirènes si fournies
    if (dto.sireneIds && dto.sireneIds.length > 0) {
      const newSirenes = await this.sireneRepo.find({
        where: { id: In(dto.sireneIds) },
      });
      if (newSirenes.length !== dto.sireneIds.length) {
        if (file) this.deleteFile(file.path);
        throw new NotFoundException('Une ou plusieurs sirènes introuvables');
      }
  
      // Vérifier les conflits avec les nouvelles sirènes
      const sousCatId = dto.sousCategorieAlerteId ?? audio.sousCategorieAlerteId;
      const conflict  = await this.repo
        .createQueryBuilder('aa')
        .innerJoin('aa.sirenes', 's')
        .where('aa.sousCategorieAlerteId = :sousCatId', { sousCatId })
        .andWhere('s.id IN (:...ids)', { ids: dto.sireneIds })
        .andWhere('aa.id != :id', { id })
        .andWhere('aa.deletedAt IS NULL')
        .getOne();
  
      if (conflict) {
        if (file) this.deleteFile(file.path);
        throw new ConflictException(
          'Un audio existe déjà pour cette sous-catégorie et une ou plusieurs des nouvelles sirènes',
        );
      }
  
      audio.sirenes = newSirenes;
    }
  
    // Gérer le fichier
    if (file) {
      // Le fichier n'est plus partagé entre plusieurs enregistrements
      // donc on supprime directement l'ancien
      this.deleteFile(audio.audio);
      audio.audio            = file.path;
      audio.originalFilename = file.originalname;
      audio.fileSize         = file.size;
      const fullPath         = join(process.cwd(), file.path);
      audio.duration         = await this.getAudioDuration(fullPath);
    }
  
    // Appliquer les autres champs du dto
    if (dto.name        !== undefined) audio.name        = dto.name;
    if (dto.description !== undefined) audio.description = dto.description;
    if (dto.sousCategorieAlerteId !== undefined)
      audio.sousCategorieAlerteId = dto.sousCategorieAlerteId;
  
    return this.repo.save(audio);
  }

  // ── REMOVE ────────────────────────────────────────────────────────────────

  async remove(id: number) {
    const audio = await this.findOne(id);

    // Ne supprimer le fichier physique que s'il n'est plus partagé
    const othersUsingFile = await this.repo.count({ where: { audio: audio.audio } });
    if (othersUsingFile <= 1) this.deleteFile(audio.audio);

    await this.repo.delete(id);
    return { message: 'Audio supprimé' };
  }

  // ── HELPER ────────────────────────────────────────────────────────────────

  private deleteFile(filePath: string) {
    if (!filePath) return;
    const absolute = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
  }
 
  private getAudioDuration(filePath: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error("FFPROBE ERROR:", err); // 🔥 AJOUT DEBUG
          return resolve(null);
        }
  
        resolve(metadata?.format?.duration ?? null);
      });
    });
  }


  // Plus besoin de approveGroup/rejectGroup — un seul audio = toutes les sirènes
  async approve(id: number) {
    const audio = await this.repo.findOne({
      where:     { id },
      relations: ['customer', 'createdByUser', 'sirenes'], // ← sirenes
    });
    if (!audio) throw new NotFoundException();

    audio.status = AudioValidationStatus.APPROVED;
    await this.repo.save(audio);

    if (audio.createdByUserId) {
      const userName     = [audio.createdByUser?.first_name, audio.createdByUser?.last_name]
        .filter(Boolean).join(' ') || audio.createdByUser?.email || '';
      const customerName = audio.customer?.name || '';
      const count        = audio.sirenes?.length ?? 1;

      await this.notifService.notify(audio.createdByUserId, {
        type:       'AUDIO_APPROVED',
        message:    `Votre audio "${audio.name || 'Sans nom'}" a été validé pour ${count} sirène${count > 1 ? 's' : ''}||${userName}||${customerName}`,
        entityType: 'alerte_audio',
        entityId:   audio.id,
        url:        `/alerte-audios`,
      });
    }

    return audio;
  }
  
  async reject(id: number, comment: string) {
    const audio = await this.repo.findOne({
      where:     { id },
      relations: ['customer', 'createdByUser'],
    });
    if (!audio) throw new NotFoundException(`Audio #${id} introuvable`);
  
    audio.status           = AudioValidationStatus.REJECTED;
    audio.rejectionComment = comment;
    await this.repo.save(audio);
  
    if (audio.createdByUserId) {
      const userName     = [audio.createdByUser?.first_name, audio.createdByUser?.last_name]
        .filter(Boolean).join(' ') || audio.createdByUser?.email || 'Utilisateur';
      const customerName = audio.customer?.name || '';
  
      await this.notifService.notify(audio.createdByUserId, {
        type:       'AUDIO_REJECTED',
        // On ajoute aussi le commentaire de refus
        message:    `Votre audio "${audio.name || 'Sans nom'}" a été refusé||${userName}||${customerName}||${comment}`,
        entityType: 'alerte_audio',
        entityId:   audio.id,
        url:        `/alerte-audios`,
      });
    }
  
    return audio;
  }
  
}