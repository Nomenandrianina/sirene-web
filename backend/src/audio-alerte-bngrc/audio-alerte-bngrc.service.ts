import { Injectable, NotFoundException, ConflictException, BadRequestException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In }   from 'typeorm';
import * as fs              from 'fs';
import * as path            from 'path';
import { join }             from 'path';
import * as ffmpeg          from 'fluent-ffmpeg';
import ffmpegInstaller      from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller     from '@ffprobe-installer/ffprobe';
import { AudioAlerteBngrc, AudioBngrcStatus,} from './entities/audio-alerte-bngrc.entity';
import { Sirene }           from '@/sirene/entities/sirene.entity';
import { CreateAudioAlerteBngrcDto, UpdateAudioAlerteBngrcDto, ValidateAudioBngrcDto, } from './dto/create-audio-alerte-bngrc.dto';
import { CategorieAlerteBngrc } from 'src/categorie-alerte-bngrc/entities/categorie-alerte-bngrc.entity';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);


@Injectable()
export class AudioAlerteBngrcService {
  constructor(
    @InjectRepository(AudioAlerteBngrc)
    private readonly repo: Repository<AudioAlerteBngrc>,
 
    @InjectRepository(Sirene)
    private readonly sireneRepo: Repository<Sirene>,
 
    @InjectRepository(CategorieAlerteBngrc)
    private readonly categorieRepo: Repository<CategorieAlerteBngrc>,
  ) {}
 
  // ── Lecture ───────────────────────────────────────────────────────────────
 
  async findAll(): Promise<AudioAlerteBngrc[]> {
    return this.repo.find({
      relations: ['categorie', 'categorie.type', 'sirenes', 'createdByUser'],
      order:     { id: 'DESC' },
    });
  }
 
  async findOne(id: number): Promise<AudioAlerteBngrc> {
    const audio = await this.repo.findOne({
      where:     { id },
      relations: ['categorie', 'categorie.type', 'categorie.type.alerte', 'sirenes', 'createdByUser'],
    });
    if (!audio) throw new NotFoundException(`AudioAlerteBngrc #${id} introuvable`);
    return audio;
  }
 
  async findByCategorie(categorieAlerteBngrcId: number): Promise<AudioAlerteBngrc[]> {
    return this.repo.find({
      where:     { categorieAlerteBngrcId },
      relations: ['sirenes'],
      order:     { id: 'DESC' },
    });
  }
 
  // ── Sync publique — filtrée par IMEI de la sirène ─────────────────────────
  // Retourne uniquement les audios APPROVED associés à cette sirène
  async findBySireneImei(sireneImei: string): Promise<AudioAlerteBngrc[]> {
    const audios = await this.repo.find({
      where:  { status: AudioBngrcStatus.APPROVED },
      // sirenes chargées via eager:true défini sur l'entité
    });
    return audios.filter(a => a.sirenes?.some(s => s.imei === sireneImei));
  }
 
  // ── Création ──────────────────────────────────────────────────────────────
  // Les audios BNGRC sont TOUJOURS auto-approuvés (créés par superadmin uniquement)
  // Pas de workflow validation, pas de notification
  async create(dto: CreateAudioAlerteBngrcDto, file: Express.Multer.File,): Promise<AudioAlerteBngrc> {
    if (!file) throw new BadRequestException('Fichier audio requis');
 
    // 1. Parser et valider les sirènes
    const sirenes = await this.sireneRepo.find();

    if (!sirenes.length) {
      this.deleteFile(file.path);
      throw new NotFoundException('Aucune sirène disponible');
    }
 
    // 3. Durée via ffprobe
    const fullPath = join(process.cwd(), file.path);
    const duration = await this.getAudioDuration(fullPath);
 
    // 4. Générer le mobileId à partir du nom de la catégorie — même logique qu'AlerteAudio
    const categorie = await this.categorieRepo.findOne({
      where:     { id: Number(dto.categorieAlerteBngrcId) },
      relations: ['type', 'type.alerte'],
    });
 
    if (!categorie) {
      this.deleteFile(file.path);
      throw new NotFoundException(`CategorieAlerteBngrc #${dto.categorieAlerteBngrcId} introuvable`);
    }
 
    const catSlug = categorie.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // supprimer accents
      .replace(/[^a-z0-9]+/g, '_')    // caractères spéciaux → _
      .replace(/^_+|_+$/g, '');       // trim underscores
 
    // Préfixe : BNGRC_ + slug du nom de l'alerte parente (tronqué à 12 car)
    const alerteName  = categorie?.type?.alerte?.name ?? '';
    const alerteSlug  = alerteName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 12);
    const prefix      = alerteSlug ? `BNGRC_${alerteSlug}_` : 'BNGRC_';
    const alerte_prefix = 'ALT_';
    const generatedMobileId = `${alerte_prefix}${prefix}${catSlug}_${Date.now()}`;
 
    // 4b. Garantir l'unicité du mobileId généré (collision ultra-rare mais possible)
    const existing = await this.repo.findOne({ where: { mobileId: generatedMobileId } });
    if (existing) {
      const suffix     = Math.random().toString(36).slice(2, 6);
      const finalMobileId = `${generatedMobileId}_${suffix}`;
      return this._saveAudio(finalMobileId, dto, file, duration, sirenes, categorie);
    }

    // 5. Créer avec status APPROVED directement
    return this._saveAudio(generatedMobileId, dto, file, duration, sirenes, categorie);
  }
 
  /** Factorisé pour éviter la duplication entre le cas normal et la collision */
  private async _saveAudio(
    mobileId:  string,
    dto:       CreateAudioAlerteBngrcDto,
    file:      Express.Multer.File,
    duration:  number | null,
    sirenes:   any[],
    categorie: any,
  ): Promise<AudioAlerteBngrc> {
    const audio = this.repo.create({
      mobileId,
      name:                   dto.name              ?? null,
      description:            dto.description        ?? null,
      audio:                  file.path,
      originalFilename:       file.originalname,
      fileSize:               file.size,
      duration,
      categorieAlerteBngrcId: Number(dto.categorieAlerteBngrcId),
      createdByUserId:        dto.createdByUserId    ?? null,
      sirenes,
      status:                 AudioBngrcStatus.APPROVED,
      rejectionComment:       null,
    });
    return this.repo.save(audio);
  }
 
  // ── Mise à jour ───────────────────────────────────────────────────────────
 
  async update(
    id: number,
    dto: UpdateAudioAlerteBngrcDto,
    file?: Express.Multer.File,
  ): Promise<AudioAlerteBngrc> {
    const audio = await this.findOne(id);
 
    // Unicité mobileId si changement
    if (dto.mobileId && dto.mobileId !== audio.mobileId) {
      const existing = await this.repo.findOne({ where: { mobileId: dto.mobileId } });
      if (existing) {
        if (file) this.deleteFile(file.path);
        throw new ConflictException(`Un audio avec le mobileId "${dto.mobileId}" existe déjà`);
      }
      audio.mobileId = dto.mobileId;
    }
 
    if (dto.name        !== undefined) audio.name        = dto.name        ?? null;
    if (dto.description !== undefined) audio.description = dto.description ?? null;
    if (dto.categorieAlerteBngrcId !== undefined)
      audio.categorieAlerteBngrcId = dto.categorieAlerteBngrcId;
 
    // Nouveau fichier audio
    if (file) {
      if (audio.audio && fs.existsSync(audio.audio)) fs.unlinkSync(audio.audio);
      audio.audio            = file.path;
      audio.originalFilename = file.originalname;
      audio.fileSize         = file.size;
      audio.duration         = await this.getAudioDuration(join(process.cwd(), file.path));
    }
 
    // Mise à jour des sirènes si fournies
    if (dto.sireneIds !== undefined) {
      const rawIds    = Array.isArray(dto.sireneIds)
        ? dto.sireneIds
        : String((dto as any).sireneIds ?? '').split(',').filter(Boolean).map(Number);

      audio.sirenes = rawIds.length
        ? await this.sireneRepo.find({ where: { id: In(rawIds) } })
        : [];
    }
 
    return this.repo.save(audio);
  }
 
  // ── Validation manuelle (optionnelle — garde la flexibilité pour l'avenir) ─
 
  async validate(id: number, dto: ValidateAudioBngrcDto): Promise<AudioAlerteBngrc> {
    const audio = await this.findOne(id);
    if (dto.status === AudioBngrcStatus.REJECTED && !dto.rejectionComment) {
      throw new BadRequestException('Un commentaire est requis pour rejeter un audio');
    }
    audio.status           = dto.status;
    audio.rejectionComment = dto.rejectionComment ?? null;
    return this.repo.save(audio);
  }
 
  // ── Gestion des sirènes ───────────────────────────────────────────────────
 
  async addSirenes(id: number, sireneIds: number[]): Promise<AudioAlerteBngrc> {
    const audio   = await this.findOne(id);
    const sirenes = await this.sireneRepo.find({ where: { id: In(sireneIds) } });
    const existing = new Set(audio.sirenes.map(s => s.id));
    audio.sirenes  = [...audio.sirenes, ...sirenes.filter(s => !existing.has(s.id))];
    return this.repo.save(audio);
  }
 
  async removeSirenes(id: number, sireneIds: number[]): Promise<AudioAlerteBngrc> {
    const audio = await this.findOne(id);
    const toRm  = new Set(sireneIds);
    audio.sirenes = audio.sirenes.filter(s => !toRm.has(s.id));
    return this.repo.save(audio);
  }
 
  // ── Suppression (soft + fichier physique) ─────────────────────────────────
 
  async remove(id: number): Promise<{ message: string }> {
    const audio = await this.findOne(id);
    if (audio.audio && fs.existsSync(audio.audio)) fs.unlinkSync(audio.audio);
    await this.repo.softRemove(audio);
    return { message: `AudioAlerteBngrc #${id} supprimé` };
  }
 
  // ── Helpers privés ────────────────────────────────────────────────────────
 
  private deleteFile(filePath: string) {
    if (!filePath) return;
    const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
 
  private getAudioDuration(filePath: string): Promise<number | null> {
    return new Promise(resolve => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) { console.error('[BNGRC ffprobe]', err); return resolve(null); }
        resolve(metadata?.format?.duration ?? null);
      });
    });
  }
}
 