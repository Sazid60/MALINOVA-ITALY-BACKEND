// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { ConfigService } from '@nestjs/config';
// import { Request } from 'express';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//   constructor(private config: ConfigService) {
//     super({
//       jwtFromRequest: ExtractJwt.fromExtractors([
//         (req: Request) => req?.cookies?.['accessToken'] ?? req?.cookies?.['adminAccessToken'] ?? null,
//         ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ]),
//       ignoreExpiration: false,
//       secretOrKey: config.get('JWT_SECRET', 'secret'),
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
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['accessToken'] ?? req?.cookies?.['adminAccessToken'] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'secret'),
    });
  }

  async validate(payload: { sub: number; Email: string; Name: string; role: string }) {
    if (!payload?.sub) throw new UnauthorizedException();
    
    // Check in-memory cache first
    const cachedUser = AuthService.getCachedUser(payload.sub);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub, status: 'active' },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('User account is deleted or inactive');
    }

    // Map to capitalized fields for compatibility with existing AuthUserDto usage
    const mappedUser = {
      ...user,
      Id: user.id,
      Email: user.email,
      Name: user.name,
    };

    // Cache the validated user object
    AuthService.setCachedUser(payload.sub, mappedUser);

    return mappedUser;
  }
}
