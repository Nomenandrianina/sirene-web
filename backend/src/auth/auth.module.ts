import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './guards/local.strategy';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { APP_GUARD } from '@nestjs/core/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { PasswordResetToken } from './entity/password-reset-token.entity';
// import { MailModule } from 'src/mail/mail.module';
// import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PasswordResetToken,
      User,
    ]),
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const secret = config.get<string>('JWT_SECRET') ?? 'default_secret';
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  // {
  //     provide: APP_GUARD,
  //     useClass: AuthGuard,
  //   }
  providers: [AuthGuard, AuthService, LocalStrategy ,UsersService, ],
  controllers: [AuthController],
  exports: [JwtModule, AuthGuard],
})
export class AuthModule {}
