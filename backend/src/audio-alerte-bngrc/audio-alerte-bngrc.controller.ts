import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, Res, ParseIntPipe, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Request,} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage }from 'multer';
import { extname } from 'path';
import { AudioAlerteBngrcService }     from './audio-alerte-bngrc.service';
import { CreateAudioAlerteBngrcDto, UpdateAudioAlerteBngrcDto, ValidateAudioBngrcDto, } from './dto/create-audio-alerte-bngrc.dto';
import { Public } from "@/common/decarators/public.decorator";
import { v4 as uuid }                from 'uuid';
import * as path                     from 'path';

// ── Multer config — même pattern que l'existant ───────────────────────────
const audioStorage = diskStorage({
  destination: './uploads/audios-bngrc',
  filename:    (_, file, cb) => {
    const ext      = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    cb(null, filename);
  },
});

const audioFilter = (
  _: any,
  file: Express.Multer.File,
  cb: (err: Error | null, accept: boolean) => void,
) => {
  const allowed = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
  const ext     = path.extname(file.originalname).toLowerCase();
  cb(allowed.includes(ext) ? null : new Error('Format audio non supporté'), allowed.includes(ext));
};

@Controller('audio-alerte-bngrc')
export class AudioAlerteBngrcController {
  constructor(private readonly service: AudioAlerteBngrcService) {}

  // ── Route publique sync sirène ────────────────────────────────────────────
  // GET /audio-alerte-bngrc/public/sync/:sireneImei
  // Format identique à /public/sync/:imei existant pour compatibilité firmware
  @Public()
  @Get('public/sync/:sireneImei')
  async syncBySirene( @Param('sireneImei') sireneImei: string, @Res() res: import('express').Response ) {
    const baseUrl = process.env.APP_URL ?? '';
    const audios  = await this.service.findBySireneImei(sireneImei);

    const data = audios.map((a) => ({
      id_web:      a.mobileId,
      name:        a.name ?? '',
      description: a.description ?? '',
      audio:       a.originalFilename ?? '',
      downloadUrl: `${baseUrl}/${a.audio.replace(/\\/g, '/')}`,
      updatedAt:   a.updatedAt ?? null,
    }));
    return res.json(data);
  }

  // ── Routes protégées ──────────────────────────────────────────────────────

  // GET /audio-alerte-bngrc
  // GET /audio-alerte-bngrc?categorieAlerteBngrcId=5
  @Get()
  findAll(@Query('categorieAlerteBngrcId') catId?: string) {
    if (catId) return this.service.findByCategorie(+catId);
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // POST /audio-alerte-bngrc  — multipart/form-data
  @Post()
  @UseInterceptors(FileInterceptor('audio', { storage: audioStorage, fileFilter: audioFilter }))
  create(
    @Body() dto: CreateAudioAlerteBngrcDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.create(dto, file);
  }

  // PUT /audio-alerte-bngrc/:id  — multipart/form-data (audio optionnel)
  @Put(':id')
  @UseInterceptors(FileInterceptor('audio', { storage: audioStorage, fileFilter: audioFilter }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAudioAlerteBngrcDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('dto :',dto)
    return this.service.update(id, dto, file);
  }

  // PATCH /audio-alerte-bngrc/:id/validate  — approve ou reject
  @Patch(':id/validate')
  validate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ValidateAudioBngrcDto,
  ) {
    return this.service.validate(id, dto);
  }

  // PATCH /audio-alerte-bngrc/:id/sirenes/add
  @Patch(':id/sirenes/add')
  addSirenes(
    @Param('id', ParseIntPipe) id: number,
    @Body('sireneIds') sireneIds: number[],
  ) {
    return this.service.addSirenes(id, sireneIds);
  }

  // PATCH /audio-alerte-bngrc/:id/sirenes/remove
  @Patch(':id/sirenes/remove')
  removeSirenes(
    @Param('id', ParseIntPipe) id: number,
    @Body('sireneIds') sireneIds: number[],
  ) {
    return this.service.removeSirenes(id, sireneIds);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
