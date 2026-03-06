import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm/repository/Repository';
import { PasswordResetToken } from './entity/password-reset-token.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { ConfigService } from '@nestjs/config';
// import { MailService } from 'src/mail/mail.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(PasswordResetToken)
        private passwordResetRepo: Repository<PasswordResetToken>,
        @InjectRepository(User)
        private usersRepo: Repository<User>,
        private usersService: UsersService,
        private configService: ConfigService,
        // private mailService: MailService,
        private jwtService: JwtService,
    ){}

    async validatUser(email: string, password: string): Promise<any>{
        const user = await this.usersService.findByEmail(email);
        if(!user) throw new UnauthorizedException();

        const passwordValid = await bcrypt.compare(password, user.password);
        if(!passwordValid) throw new UnauthorizedException();

        const {password: _, ...result} = user;
        return result;
    }

    async login(user: any) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: {               // ← ajouter ceci
                id: user.role?.id,
                name: user.role?.name,
            },
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '60m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    async refresh(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
             secret: process.env.JWT_REFRESH_SECRET,
            });

            const newAccessToken = this.jwtService.sign(
            {
                sub: payload.sub,
                email: payload.email,
            },
            {
                secret: process.env.JWT_SECRET,
                expiresIn: '15m',
            },
            );

            return {
                access_token: newAccessToken,
            };
        } catch (e) {
            throw new UnauthorizedException('Invalid refresh token');
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
