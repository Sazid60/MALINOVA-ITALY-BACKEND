import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { ClientRegisterDto } from './dto/client-register.dto';
import { ClientResetRequestDto, ClientResetVerifyDto, ClientResetSubmitDto } from './dto/client-reset.dto';
import { ClientUpdateProfileDto } from './dto/client-update-profile.dto';
import { ClientChangePasswordDto } from './dto/client-change-password.dto';
import { CloudinaryService } from '../upload/cloudinary.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ClientAuthService {
  private readonly logger = new Logger(ClientAuthService.name);
  private resetOtps = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
    private cloudinaryService: CloudinaryService,
    private notificationService: NotificationService,
  ) {}

  async register(dto: ClientRegisterDto, file?: Express.Multer.File) {
    const emailLower = dto.email ? dto.email.toLowerCase() : null;

    const existingUser = await this.userRepo.findOne({
      where: emailLower
        ? [{ email: emailLower, is_deleted: false }]
        : { is_deleted: false },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered.');
    }

    const newUser = this.userRepo.create({
      name: dto.name,
      email: emailLower,
      mobile_number: dto.mobile_number,
      password: dto.password,
    });

    await this.userRepo.save(newUser);
    return this.login({ email: dto.email, password: dto.password });
  }

  async login(dto: any) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase(), is_deleted: false },
    });

    if (!user || !(await user.validatePassword(dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, name: user.name };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret'),
      expiresIn: '30d',
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId, is_deleted: false },
    });
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id, email: user.email, name: user.name, mobile_number: user.mobile_number };
  }
}
