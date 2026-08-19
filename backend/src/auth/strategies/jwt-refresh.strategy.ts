import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { AppConfig } from '../../config/configuration';
import type { AuthenticatedUser } from '../types/authenticated-user.interface';

interface JwtPayload {
  sub: string;
  email: string;
  role: AuthenticatedUser['role'];
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.get<AppConfig>('app')!.jwt.refreshSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): AuthenticatedUser & { refreshToken: string } {
    const refreshToken = (req.body as { refreshToken?: string })?.refreshToken ?? '';
    return { userId: payload.sub, email: payload.email, role: payload.role, refreshToken };
  }
}
