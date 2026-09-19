import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ResetPasswordStrategy extends PassportStrategy(Strategy, 'reset-password') {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          req?.cookies?.['passwordResetToken'] ??
          req?.cookies?.['adminPasswordResetToken'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_RESET_SECRET', 'reset-secret'),
    });
  }

  async validate(payload: { sub: number; Email: string; VerificationNo: string }) {
    if (!payload?.Email) throw new UnauthorizedException('Invalid reset token');
    return { Id: payload.sub, Email: payload.Email, VerificationNo: payload.VerificationNo };
  }
}
