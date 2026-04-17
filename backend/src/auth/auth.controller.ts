import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from 'src/common/decarators/public.decorator';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('auth')
export class AuthController {
    constructor(
    private authService: AuthService,
    private jwtService: JwtService
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    const token = await this.authService.login(req.user);
    return {
      status: 200,
      message: 'Login successful',
      response: token,
    };
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
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
