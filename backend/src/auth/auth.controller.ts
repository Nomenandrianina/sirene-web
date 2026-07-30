import { Controller, Post, UseGuards, Request, Body, Res, Req,} from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from 'src/common/decarators/public.decorator';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/auth', // le cookie n'est renvoyé au serveur que sur /auth/*
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours, doit matcher la durée du refresh token
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Authentifie l'utilisateur (email + mot de passe via LocalAuthGuard),
   * place le refresh token dans un cookie httpOnly, et renvoie l'access
   * token dans le corps de la réponse.
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const { access_token, refresh_token } = await this.authService.login(req.user);

    res.cookie(REFRESH_COOKIE_NAME, refresh_token, REFRESH_COOKIE_OPTIONS);

    return {
      status: 200,
      message: 'Login successful',
      response: { access_token },
    };
  }

  /**
   * Génère un nouvel access token à partir du refresh token présent
   * dans le cookie httpOnly (jamais lu depuis le body : le front n'a
   * plus accès au refresh token en JS).
   */
  @Public()
  @Post('refresh')
  async refresh(@Req() req: ExpressRequest) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const result = await this.authService.refresh(refreshToken);
    return { status: 200, response: result };
  }

  /**
   * Déconnecte l'utilisateur : révoque le refresh token en base
   * et supprime le cookie côté navigateur.
   */
  @Post('logout')
  async logout(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await this.authService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth' });
    return { status: 200, message: 'Logged out' };
  }

  @Public()
  @Post('forgot-password')
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If email exists, reset link sent' };
  }

  @Public()
  @Post('reset-password')
  async reset(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password updated successfully' };
  }
}