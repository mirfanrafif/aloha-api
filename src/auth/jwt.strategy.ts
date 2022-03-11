import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserJwtPayload } from './auth.dto';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'sebuah_secret',
    });
  }

  async validate(payload: UserJwtPayload) {
    const user = await this.authService.findUser(payload.id);
    if (user !== undefined) {
      const { password, ...data } = user;
      return data;
    }
  }
}
