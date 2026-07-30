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
import { RefreshToken } from '@/refresh-token/entities/refresh-token.entity';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(PasswordResetToken)
    private passwordResetRepo: Repository<PasswordResetToken>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private usersService: UsersService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  /**
   * Vérifie les identifiants d'un utilisateur (email + mot de passe).
   * Utilisé par la LocalStrategy lors du login.
   */
  async validatUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException();
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException();
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Connecte un utilisateur : génère un access token (courte durée)
   * et un refresh token (longue durée), et enregistre le hash de ce
   * dernier en base pour pouvoir le révoquer plus tard (logout,
   * changement de mot de passe, détection de vol...).
   */
  async login(user: any) {
    const fullUser = await this.usersRepo.findOne({
      where: { id: user.id },
      relations: ["role", "role.permissions", "customer"],
    });

    if (!fullUser) throw new UnauthorizedException("Utilisateur introuvable");

    const permissions = fullUser?.role?.permissions?.map(p => p.name) ?? [];

    const payload = {
      sub: fullUser.id,
      email: fullUser.email,
      role: { id: fullUser.role?.id, name: fullUser.role?.name },
      permissions,
      customerId: fullUser.customer?.id ?? null,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '8h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    await this.storeRefreshToken(fullUser, refreshToken);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  /**
   * Retourne le profil complet de l'utilisateur connecté, avec ses permissions.
   * Utilisé par la route /auth/me.
   */
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

  /**
   * Génère un nouvel access token à partir d'un refresh token valide.
   * Vérifie trois choses avant d'accepter : la signature JWT, l'existence
   * du hash en base, et qu'il n'a pas été révoqué (logout ou reset password).
   */
  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token manquant");
    }

    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const tokenHash = this.hashToken(refreshToken);

    const stored = await this.refreshTokenRepo.findOne({
      where: { token_hash: tokenHash },
    });

    if (!stored || stored.revoked_at || stored.expires_at < new Date()) {
      throw new UnauthorizedException("Refresh token invalide ou révoqué");
    }

    const user = await this.usersRepo.findOne({
      where: { id: payload.sub },
      relations: ["role", "role.permissions", "customer"],
    });

    if (!user) throw new UnauthorizedException("Utilisateur introuvable");

    const permissions = user.role?.permissions?.map(p => p.name) ?? [];

    const newAccessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: { id: user.role?.id, name: user.role?.name },
        permissions,
        customerId: user.customer?.id ?? null,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '8h',
      },
    );

    return { access_token: newAccessToken };
  }

  /**
   * Déconnecte l'utilisateur : révoque son refresh token en base.
   * Le token JWT reste "signé valide" jusqu'à expiration naturelle,
   * mais ne pourra plus être utilisé pour obtenir un nouvel access token
   * puisqu'on vérifie systématiquement le statut de révocation en base.
   */
  async logout(refreshToken: string) {
    if (!refreshToken) return;

    const tokenHash = this.hashToken(refreshToken);

    await this.refreshTokenRepo.update(
      { token_hash: tokenHash },
      { revoked_at: new Date() },
    );
  }

  /**
   * Révoque tous les refresh tokens actifs d'un utilisateur.
   * À appeler après un changement ou une réinitialisation de mot de passe,
   * pour forcer la déconnexion de toutes les sessions existantes.
   */
  async revokeAllRefreshTokens(userId: number) {
    await this.refreshTokenRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked_at: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);

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

    await this.passwordResetRepo.manager.transaction(async (manager) => {
      user.password = await bcrypt.hash(newPassword, 10);
      user.password_changed_at = new Date();
      await manager.save(user);
      await manager.delete(this.passwordResetRepo.target, resetToken.id);
    });

    // Un mot de passe réinitialisé = toutes les sessions existantes
    // (potentiellement compromises) sont invalidées.
    await this.revokeAllRefreshTokens(user.id);
  }

  /** Hash SHA-256 utilisé pour stocker/rechercher un refresh token sans jamais garder sa valeur brute. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Enregistre le hash d'un nouveau refresh token émis, avec sa date d'expiration (7 jours). */
  private async storeRefreshToken(user: User, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepo.save({
      user,
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked_at: null,
    });
  }
}