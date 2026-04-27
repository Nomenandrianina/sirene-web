import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe,
  UseInterceptors, UploadedFile, BadRequestException, Res, Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { AlerteAudioService } from "./alerte-audio.service";
import { CreateAlerteAudioDto } from "./dto/create-alerte-audio.dto";
import { UpdateAlerteAudioDto } from "./dto/update-alerte-audio.dto";
import { Public } from "@/common/decarators/public.decorator";
import { SirenesService } from "@/sirene/sirene.service";

// Gardez vos configs multer existantes :
const audioStorage = diskStorage({
  destination: "./uploads/audios",
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const audioFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowed = [".mp3", ".wav", ".ogg", ".aac", ".m4a", ".opus"];
  const ext = extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new BadRequestException(`Format non supporté: ${ext}`), false);
};


@Controller('alerte-audios')
export class AlerteAudioController {
  constructor(private readonly service: AlerteAudioService,private readonly sireneservice:SirenesService) {}

  // GET /alerte-audios
  @Get()
  findAll(@Query('sousCategorieAlerteId') sousCategorieAlerteId?: string) {
    return this.service.findAll(sousCategorieAlerteId ? +sousCategorieAlerteId : undefined);
  }
 
  @Get('findAllbycustumer')
  findAllByCustomers( @Query('customerId') customerId?: string,  ) {
    return this.service.findAllbyCustomer(customerId ? +customerId : undefined);
  }

  // GET /alerte-audios/used-sous-categories  — préservé
  @Get('used-sous-categories')
  getUsedSousCategorieIds() {
    return this.service.getUsedSousCategorieIds();
  }

  // ✅ NOUVEAU — GET /alerte-audios/used-combinations
  // Retourne [{ sousCategorieAlerteId, sireneId }] déjà pris
  @Get('used-combinations')
  getUsedCombinations() {
    return this.service.getUsedCombinations();
  }

  // ✅ NOUVEAU — GET /alerte-audios/sirene/:sireneId
  @Get('sirene/:sireneId')
  findBySirene(@Param('sireneId', ParseIntPipe) sireneId: number) {
    return this.service.findBySirene(sireneId);
  }

  // GET /alerte-audios/public/sync-all  — préservé + ajout sirene_id
  @Public()
  @Get('public/sync-all')
  async syncAll(@Query('imei') imei: string, @Res() res: import('express').Response) {
      if (!imei) {
        return res.status(400).json({ message: "IMEI requis" });
      }

      const baseUrl = process.env.APP_URL ?? '';

      // 1. Trouver la sirène via IMEI
      const sirene = await this.sireneservice.findSireneByImei(imei);

      if (!sirene) {
        return res.status(404).json({ message: "Sirène introuvable" });
      }

      // 2. Récupérer les audios de cette sirène
      const audios = await this.service.findBySirene(sirene.id);

      // 3. Mapper
      const data = audios.map((a: any) => ({
        id_web:      a.mobileId,
        sirene_id:   a.sireneId,
        name:        a.name ?? '',
        description: a.description ?? '',
        audio:       a.originalFilename ?? '',
        downloadUrl: `${baseUrl}/${a.audio.replace(/\\/g, '/')}`,
        updatedAt:   a.updatedAt ?? null,
      }));

      return res.json(data);
  }

  // ✅ NOUVEAU — GET /alerte-audios/public/sync/:sireneImei
  // La sirène ne télécharge QUE ses propres audios
  @Public()
  @Get('public/sync/:sireneImei')
  async syncBySirene(
    @Param('sireneImei') sireneImei: string,
    @Res() res: import('express').Response,
  ) {
    const baseUrl = process.env.APP_URL ?? '';
    const all = await this.service.findAll();
    const data = (Array.isArray(all) ? all : [])
      .filter((a: any) => 
        a.sirene?.imei === sireneImei  // audio lié à cette sirène
        || a.sireneId === null          // OU audio par défaut (sans sirène)
      )
      .map((a: any) => ({
        id_web:      a.mobileId,
        name:        a.name ?? '',
        description: a.description ?? '',
        audio:       a.originalFilename ?? '',
        downloadUrl: `${baseUrl}/${a.audio.replace(/\\/g, '/')}`,
        updatedAt:   a.updatedAt ?? null,
      }));
    return res.json(data);
  }

  // GET /alerte-audios/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // POST /alerte-audios — retourne AlerteAudio[] (un par sirène)
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: audioStorage, fileFilter: audioFilter }))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAlerteAudioDto,
  ) {
    if (!file) throw new BadRequestException('Le fichier audio est obligatoire');
    return this.service.create(dto, file);
  }

  // PATCH /alerte-audios/:id — inchangé
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', { storage: audioStorage, fileFilter: audioFilter }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAlerteAudioDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.update(id, dto, file);
  }

  // DELETE /alerte-audios/:id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}