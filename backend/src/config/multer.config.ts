// src/config/multer.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

// Types d'images acceptés
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES     = 2 * 1024 * 1024; // 2 MB

export const avatarMulterConfig = {
  storage: diskStorage({
    destination: './uploads/avatars',
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: MAX_SIZE_BYTES,
  },
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new BadRequestException('Seuls les fichiers JPG, PNG et WebP sont acceptés'),
        false,
      );
    }
    cb(null, true);
  },
};