import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AlerteAudio } from "./entities/alerte-audio.entity";
import { CreateAlerteAudioDto } from "./dto/create-alerte-audio.dto";
import { UpdateAlerteAudioDto } from "./dto/update-alerte-audio.dto";
import * as fs from "fs";
import * as path from "path";
@Injectable()
export class AlerteAudioService {
  constructor(
    @InjectRepository(AlerteAudio)
    private readonly repo: Repository<AlerteAudio>,
  ) {}
 
  findAll(sousCategorieAlerteId?: number) {
    return this.repo.find({
      where: sousCategorieAlerteId ? { sousCategorieAlerteId } : {},
      relations: ["sousCategorie"],
      order: { createdAt: "DESC" },
    });
  }
 
  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id }, relations: ["sousCategorie"] });
    if (!item) throw new NotFoundException(`AlerteAudio #${id} introuvable`);
    return item;
  }
 
  // Retourne les ids de sous-catégories déjà utilisées (pour le frontend)
  async getUsedSousCategorieIds(): Promise<number[]> {
    const used = await this.repo.find({ select: ["sousCategorieAlerteId"], withDeleted: false });
    return used.map(a => a.sousCategorieAlerteId);
  }
 
  async create(dto: CreateAlerteAudioDto, file: Express.Multer.File) {
    // Vérifier unicité avant insert
    const existing = await this.repo.findOne({
      where: { sousCategorieAlerteId: dto.sousCategorieAlerteId },
    });
    if (existing) {
      // Supprimer le fichier uploadé puisqu'on annule
      this.deleteFile(file.path);
      throw new ConflictException(
        `Un audio existe déjà pour cette sous-catégorie (id: ${dto.sousCategorieAlerteId})`
      );
    }
 
    const audio = this.repo.create({
      ...dto,
      audio:            file.path,
      originalFilename: file.originalname,
      fileSize:         file.size,
    });
    return this.repo.save(audio);
  }
 
  async update(id: number, dto: UpdateAlerteAudioDto, file?: Express.Multer.File) {
    const audio = await this.findOne(id);
 
    // Si changement de sous-catégorie, vérifier qu'elle n'est pas déjà prise par un autre
    if (dto.sousCategorieAlerteId && dto.sousCategorieAlerteId !== audio.sousCategorieAlerteId) {
      const conflict = await this.repo.findOne({
        where: { sousCategorieAlerteId: dto.sousCategorieAlerteId },
      });
      if (conflict && conflict.id !== id) {
        if (file) this.deleteFile(file.path);
        throw new ConflictException(
          `Un audio existe déjà pour cette sous-catégorie (id: ${dto.sousCategorieAlerteId})`
        );
      }
    }
 
    if (file) {
      this.deleteFile(audio.audio);
      audio.audio            = file.path;
      audio.originalFilename = file.originalname;
      audio.fileSize         = file.size;
    }
 
    Object.assign(audio, dto);
    return this.repo.save(audio);
  }
 
  async remove(id: number) {
    const audio = await this.findOne(id);
    this.deleteFile(audio.audio);
    await this.repo.softDelete(id);
    return { message: "Audio supprimé" };
  }
 
  private deleteFile(filePath: string) {
    if (!filePath) return;
    const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
  }
}
 