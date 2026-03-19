import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { randomBytes, createHash } from "crypto";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { PasswordResetToken } from './entity/password-reset-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private passwordResetRepo: Repository<PasswordResetToken>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private usersService: UsersService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  // ── Validation login ──────────────────────────────────
  async validatUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException();
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException();
    const { password: _, ...result } = user;
    return result;
  }

  // ── Login — inclure les permissions dans le payload JWT ──
  async login(user: any) {
    // Recharger l'user avec role + permissions (eager peut ne pas suffire)
    const fullUser = await this.usersRepo.findOne({
      where: { id: user.id },
      relations: ["role", "role.permissions", "customer"],
    });

    if (!fullUser) throw new UnauthorizedException("Utilisateur introuvable");


    const permissions = fullUser?.role?.permissions?.map(p => p.name) ?? [];

    const payload = {
      sub:         fullUser.id,
      email:       fullUser.email,
      role:        { id: fullUser.role?.id, name: fullUser.role?.name },
      permissions, // ["users:read", "users:create", ...]
      customerId:  fullUser.customer?.id ?? null,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret:    process.env.JWT_SECRET,
      expiresIn: "60m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:    process.env.JWT_REFRESH_SECRET,
      expiresIn: "7d",
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  // ── /auth/me — retourne profil complet + permissions ──
  async getMe(userId: number) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ["role", "role.permissions", "customer"],
    });
    if (!user) throw new UnauthorizedException();

    const { password, ...rest } = user as any;
    return {
      ...rest,
      permissions: user.role?.permissions?.map(p => p.name) ?? [],
    };
  }

  // ── Refresh token ─────────────────────────────────────
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      // Recharger les permissions à jour
      const user = await this.usersRepo.findOne({
        where: { id: payload.sub },
        relations: ["role", "role.permissions"],
      });
      const permissions = user?.role?.permissions?.map(p => p.name) ?? [];

      const newAccessToken = this.jwtService.sign(
        { sub: payload.sub, email: payload.email, role: { id: user?.role?.id, name: user?.role?.name }, permissions,
        customerId: user?.customer?.id ?? null, 
      },
        { secret: process.env.JWT_SECRET, expiresIn: "60m" },
      );
      return { access_token: newAccessToken };
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }


  
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await this.passwordResetRepo.save({
        token_hash: tokenHash,
        user,
        expires_at: expires,
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    // await this.mailService.sendMail({
    //     to: user.email,
    //     subject: 'Réinitialisation mot de passe',
    //     template: 'reset-password',
    //     context: { resetLink },
    // });
}

    async resetPassword(token: string, newPassword: string) {
        const tokenHash = createHash('sha256').update(token).digest('hex');

        const resetToken = await this.passwordResetRepo.findOne({
            where: { token_hash: tokenHash },
            relations: ['user'],
        });

        if (!resetToken) {
            throw new BadRequestException({ code: 'INVALID_TOKEN' });
        }

        if (resetToken.expires_at < new Date()) {
            await this.passwordResetRepo.delete(resetToken.id);
            throw new BadRequestException({ code: 'TOKEN_EXPIRED' });
        }

        const user = resetToken.user;

        const samePassword = await bcrypt.compare(newPassword, user.password);
        if (samePassword) {
            throw new BadRequestException({ code: 'SAME_PASSWORD' });
        }

        // ✅ Transaction atomique : les deux opérations réussissent ou échouent ensemble
        await this.passwordResetRepo.manager.transaction(async (manager) => {
            user.password = await bcrypt.hash(newPassword, 10);
            user.password_changed_at = new Date();
            await manager.save(user);
            await manager.delete(this.passwordResetRepo.target, resetToken.id);
        });
    }

}