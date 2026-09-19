import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';

@Injectable()
export class ClientJwtStrategy extends PassportStrategy(Strategy, 'client-jwt') {
  constructor(
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['clientAccessToken'] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'secret'),
    });
  }

  async validate(payload: { sub: any; Email: string; Name: string }) {
    if (!payload?.sub) throw new UnauthorizedException();
    
    const user = await this.userRepo.findOne({
      where: { id: Number(payload.sub), is_deleted: false },
    });

    if (!user) {
      throw new UnauthorizedException('User account is deleted or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      mobile_number: user.mobile_number,
    };
  }
}
