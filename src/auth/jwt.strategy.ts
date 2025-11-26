import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

export interface JwtPayload {
  username: string;
  sub: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || '',
    });
  }

  async validate(payload: JwtPayload) {
    // En producción, podrías validar contra la BD
    if (!payload.username || payload.role !== 'admin') {
      throw new UnauthorizedException(
        'Invalid token or insufficient permissions',
      );
    }

    return {
      username: payload.username,
      role: payload.role,
    };
  }
}
