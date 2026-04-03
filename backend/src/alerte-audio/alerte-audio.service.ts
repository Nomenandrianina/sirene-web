import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as fs   from 'fs';
import * as path from 'path';
import { AlerteAudio }          from './entities/alerte-audio.entity';
import { CreateAlerteAudioDto } from './dto/create-alerte-audio.dto';
import { UpdateAlerteAudioDto } from './dto/update-alerte-audio.dto';
import { SousCategorieAlerte }  from '@/sous-categorie-alerte/entities/sous-categorie-alerte.entity';
import { Sirene }               from '@/sirene/entities/sirene.entity';
import * as ffmpeg from 'fluent-ffmpeg';
// import * as mm from 'music-metadata';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { join } from "path";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

@Injectable()
export class AlerteAudioService {
  constructor(
    @InjectRepository(AlerteAudio)
    private readonly repo: Repository<AlerteAudio>,

    @InjectRepository(SousCategorieAlerte)
    private readonly sousCatRepo: Repository<SousCategorieAlerte>,

    // ✅ NOUVEAU
    @InjectRepository(Sirene)
    private readonly sireneRepo: Repository<Sirene>,
  ) {}

  // ── READ ALL ──────────────────────────────────────────────────────────────

  findAll(sousCategorieAlerteId?: number) {
    return this.repo.find({
      where: sousCategorieAlerteId ? { sousCategorieAlerteId } : {},
      relations: ['sousCategorie', 'sirene'], // ← ajout sirene
      order: { createdAt: 'DESC' },
    });
  }

  // ── READ ONE ──────────────────────────────────────────────────────────────

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['sousCategorie', 'sirene'], // ← ajout sirene
    });
    if (!item) throw new NotFoundException(`AlerteAudio #${id} introuvable`);
    return item;
  }

  // ── READ BY SIRENE ────────────────────────────────────────────────────────
  // ✅ NOUVEAU — pour la sync mobile : GET /alerte-audios/sirene/:imei

  findBySirene(sireneId: number) {
    return this.repo.find({
      where: { sireneId },
      relations: ['sousCategorie'],
      order: { createdAt: 'DESC' },
    });
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
    return this.repo.find({
      select: ['sousCategorieAlerteId', 'sireneId'],
      withDeleted: false,
    });
  }

  // ── CREATE ────────────────────────────────────────────────────────────────
  // ✅ MODIFIÉ — crée un AlerteAudio par sirène sélectionnée
  //    Logique mobileId, préfixe ALT_/ANN_ et deleteFile : tous préservés

  async create(dto: CreateAlerteAudioDto, file: Express.Multer.File): Promise<AlerteAudio[]> {

    console.log('dto',dto)
    // 1. Parser sireneIds (multipart envoie du string ou tableau de strings)
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

    // 3. Vérifier qu'aucune combinaison (sousCat + sirène) n'existe déjà
    const conflicts = await this.repo.find({
      where: {
        sousCategorieAlerteId: Number(dto.sousCategorieAlerteId),
        sireneId: In(sireneIds),
      },
    });
    if (conflicts.length > 0) {
      this.deleteFile(file.path);
      const dups = conflicts.map(e => `sirène #${e.sireneId}`).join(', ');
      throw new ConflictException(
        `Un audio pour cette sous-catégorie existe déjà pour : ${dups}`,
      );
    }

    // 4. Charger la sous-catégorie pour générer le mobileId (même logique qu'avant)
    const sousCat = await this.sousCatRepo.findOne({
      where: { id: Number(dto.sousCategorieAlerteId) },
    });

    const baseName = (sousCat?.name ?? `sous_cat_${dto.sousCategorieAlerteId}`)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    // Préfixe ALT_ / ANN_ — préservé
    let prefix = '';
    const alerteName = sousCat?.alerte?.name ?? '';
    if (alerteName.includes('Catastrophe') || alerteName.includes('Alerte'))           prefix = 'ALT_';
    if (alerteName.includes('Communication') || alerteName.includes('Sensibilisation')) prefix = 'ANN_';

    console.log("File exists:", fs.existsSync(file.path));

    const fullPath = join(process.cwd(), file.path);
    const duree = await this.getAudioDuration(fullPath);

    // 5. Créer un enregistrement par sirène
    const created: AlerteAudio[] = [];

    for (const sirene of sirenes) {
      // mobileId manuel respecté uniquement si une seule sirène
      const mobileId =
        dto.mobileId && dto.mobileId !== 'undefined' && dto.mobileId.trim() && sirenes.length === 1
          ? dto.mobileId.trim()
          : `${prefix}${baseName}_S${sirene.id}_${Date.now()}`;

      const audio                     = new AlerteAudio();
      audio.mobileId                  = mobileId;
      audio.sousCategorieAlerteId     = Number(dto.sousCategorieAlerteId);
      audio.sireneId                  = sirene.id;   // ✅ NOUVEAU
      audio.name                      = dto.name        ?? null;
      audio.description               = dto.description ?? null;
      audio.duration                  = dto.duration    ?? null;
      audio.audio                     = file.path;   // chemin partagé
      audio.originalFilename          = file.originalname;
      audio.fileSize                  = file.size;
      audio.duration                  = duree;


      created.push(await this.repo.save(audio));
    }

    return created;
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  // Un seul enregistrement à la fois — logique inchangée sauf contrainte composite

  async update(id: number, dto: UpdateAlerteAudioDto, file?: Express.Multer.File) {
    const audio = await this.findOne(id);

    if (dto.sousCategorieAlerteId && dto.sousCategorieAlerteId !== audio.sousCategorieAlerteId) {
      const conflict = await this.repo.findOne({
        where: {
          sousCategorieAlerteId: dto.sousCategorieAlerteId,
          sireneId: audio.sireneId, // ✅ contrainte composite (sousCat + sirène)
        },
      });
      if (conflict && conflict.id !== id) {
        if (file) this.deleteFile(file.path);
        throw new ConflictException(
          `Un audio existe déjà pour cette sous-catégorie et cette sirène (id: ${dto.sousCategorieAlerteId})`,
        );
      }
    }

    if (file) {
      // Ne supprimer que si le fichier n'est plus utilisé par d'autres enregistrements
      const othersUsingFile = await this.repo.count({ where: { audio: audio.audio } });
      if (othersUsingFile <= 1) this.deleteFile(audio.audio);
      audio.audio            = file.path;
      audio.originalFilename = file.originalname;
      audio.fileSize         = file.size;
    }

    Object.assign(audio, dto);
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

  
}