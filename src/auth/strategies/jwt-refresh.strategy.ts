// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { ConfigService } from '@nestjs/config';
// import { Request } from 'express';

// @Injectable()
// export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
//   constructor(private config: ConfigService) {
//     super({
//       jwtFromRequest: ExtractJwt.fromExtractors([
//         (req: Request) => req?.cookies?.['refreshToken'] ?? req?.cookies?.['adminRefreshToken'] ?? null,
//         ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ]),
//       ignoreExpiration: false,
//       secretOrKey: config.get('JWT_REFRESH_SECRET', 'refresh-secret'),
//     });
//   }

//   async validate(payload: { sub: number; Email: string; Name: string; role: string }) {
//     if (!payload?.sub) throw new UnauthorizedException();
//     return { Id: payload.sub, Email: payload.Email, Name: payload.Name, role: payload.role };
//   }
// }


import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['refreshToken'] ?? req?.cookies?.['adminRefreshToken'] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_REFRESH_SECRET', 'refresh-secret'),
    });
  }

  async validate(payload: { sub: number; Email: string; Name: string; role: string }) {
    if (!payload?.sub) throw new UnauthorizedException();

    const user = await this.userRepo.findOne({
      where: { id: payload.sub, status: 'active' },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('User account is deleted or inactive');
    }

    // Map to capitalized fields for compatibility with existing AuthUserDto usage
    return {
      ...user,
      Id: user.id,
      Email: user.email,
      Name: user.name,
    };
  }
}