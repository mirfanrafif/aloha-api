import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserJwtPayload } from './auth.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'sebuah_secret',
    });
  }

  async validate(payload: UserJwtPayload) {
    return {
      id: payload.id,
      full_name: payload.full_name,
      email: payload.email,
      role: payload.role,
      created_at: payload.created_at,
    };
  }
}
