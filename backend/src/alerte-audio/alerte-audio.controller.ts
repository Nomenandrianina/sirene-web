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
import { Response } from 'express';
import { Public } from "@/common/decarators/public.decorator";

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

@Controller("alerte-audios")
export class AlerteAudioController {
  constructor(private readonly service: AlerteAudioService) {}

  @Get()
  findAll(@Query("sousCategorieAlerteId") sousCategorieAlerteId?: string) {
    return this.service.findAll(sousCategorieAlerteId ? +sousCategorieAlerteId : undefined);
  }

  // Endpoint pour récupérer les sous-catégories déjà utilisées (frontend)
  @Get("used-sous-categories")
  getUsedSousCategorieIds() {
    return this.service.getUsedSousCategorieIds();
  }

  // alerte-audio.controller.ts
  @Public()
  @Get('public/sync-all')
  async syncAll(@Res() res: import('express').Response) {
    const audios = await this.service.findAll();
    const baseUrl = process.env.APP_URL ;

    const data = (Array.isArray(audios) ? audios : (audios as any).response ?? [])
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

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor("file", { storage: audioStorage, fileFilter: audioFilter }))
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateAlerteAudioDto) {
    if (!file) throw new BadRequestException("Le fichier audio est obligatoire");
    return this.service.create(dto, file);
  }

  @Patch(":id")
  @UseInterceptors(FileInterceptor("file", { storage: audioStorage, fileFilter: audioFilter }))
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAlerteAudioDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.update(id, dto, file);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}