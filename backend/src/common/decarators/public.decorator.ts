import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Décorateur à mettre sur les routes publiques
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
