import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AlerteAudio } from "./entities/alerte-audio.entity";
import { CreateAlerteAudioDto } from "./dto/create-alerte-audio.dto";
import { UpdateAlerteAudioDto } from "./dto/update-alerte-audio.dto";
import * as fs from "fs";
import * as path from "path";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";
import { SousCategorieAlerteService } from "@/sous-categorie-alerte/sous-categorie-alerte.service";
import { Console } from "console";
@Injectable()
export class AlerteAudioService {
  constructor(
    @InjectRepository(AlerteAudio)         private readonly repo: Repository<AlerteAudio>,
    @InjectRepository(SousCategorieAlerte) private readonly sousCatRepo: Repository<SousCategorieAlerte>,
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
    const existing = await this.repo.findOne({
      where: { sousCategorieAlerteId: dto.sousCategorieAlerteId },
    });


    if (existing) {
      this.deleteFile(file.path);
      throw new ConflictException(
        `Un audio existe déjà pour cette sous-catégorie (id: ${dto.sousCategorieAlerteId})`
      );
    }


  
    // Charger la sous-catégorie pour générer le mobileId
    const sousCat = await this.sousCatRepo.findOne({
      where: { id: Number(dto.sousCategorieAlerteId) },
    });
    

    // Générer mobileId basé sur le nom : "inondation_1_jour_avant_danger_001"
    const baseName = (sousCat?.name ?? `sous_cat_${dto.sousCategorieAlerteId}`)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")   // supprimer accents
      .replace(/[^a-z0-9]+/g, "_")       // remplacer caractères spéciaux par _
      .replace(/^_+|_+$/g, "");          // supprimer _ en début/fin
  
    let mobileId = (dto.mobileId && dto.mobileId !== "undefined" && dto.mobileId.trim())
    ? dto.mobileId.trim()
    : `${baseName}_${Date.now()}`;

    if (sousCat?.alerte?.name?.includes("Catastrophe") || sousCat?.alerte?.name?.includes("Alerte")) {
      mobileId = `ALT_${mobileId}`;
    }
    
    if (sousCat?.alerte?.name?.includes("Communication") || sousCat?.alerte?.name?.includes("Sensibilisation")) {
      mobileId = `ANN_${mobileId}`;
    }

    const audio = new AlerteAudio();
    audio.mobileId              = mobileId;
    audio.sousCategorieAlerteId = Number(dto.sousCategorieAlerteId);
    audio.name                  = dto.name        ?? null;
    audio.description           = dto.description ?? null;
    audio.duration              = dto.duration    ?? null;
    audio.audio                 = file.path;
    audio.originalFilename      = file.originalname;
    audio.fileSize              = file.size;
  
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
    await this.repo.delete(id);
    return { message: "Audio supprimé" };
  }
 
  private deleteFile(filePath: string) {
    if (!filePath) return;
    const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
  }
}
 