import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          if (req?.cookies?.accessToken) {
            return req.cookies.accessToken;
          }
          if (req?.headers?.cookie) {
            const match = req.headers.cookie.match(/accessToken=([^;]+)/);
            if (match) return match[1];
          }
          return null;
        },
      ]),
      secretOrKey: config.get('JWT_SECRET', 'secret'),
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.userRepo.findOne({
      where: { id: payload.sub, status: 'active' },
      relations: ['role'],
    });
    if (!user) throw new UnauthorizedException('User not found or inactive');
    return user;
  }
}
