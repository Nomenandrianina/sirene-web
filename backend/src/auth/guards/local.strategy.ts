import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // utilise email au lieu de username
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validatUser(email, password);
    if (!user) {
      throw new UnauthorizedException({code: 'INVALID_CREDENTIALS'});
    }
    return user;
  }
}
