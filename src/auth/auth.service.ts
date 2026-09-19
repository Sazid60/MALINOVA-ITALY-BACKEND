import {
  Injectable, UnauthorizedException, ConflictException,
  BadRequestException, NotFoundException,ForbiddenException,
  Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { RolePermission } from '../roles/role-permission.entity';
import { UserPermission } from '../users/user-permission.entity';
import { AuthDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignupVerifyDTO } from './dto/signup-verify.dto';
import { PasswordResetRequestDTO } from './dto/reset-password/password-reset-request.dto.';
import { PasswordResetDTO } from './dto/reset-password/password-reset.dto';
import { OtpStore } from './otp.store';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MailService } from '../common/mail/mail.service';

interface ProfileCacheEntry {
  profile: any;
  expiresAt: number;
}

interface UserCacheEntry {
  user: any;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  private static readonly profileCache = new Map<number, ProfileCacheEntry>();
  private static readonly profileInFlight = new Map<number, Promise<any>>();
  private static readonly userCache = new Map<number, UserCacheEntry>();

  static invalidateProfileCache(userId: number): void {
    AuthService.profileCache.delete(userId);
    AuthService.userCache.delete(userId);
  }

  static invalidateRoleProfileCache(roleId: number): void {
    for (const [userId, entry] of AuthService.profileCache.entries()) {
      if (entry.profile?.role?.id === roleId) {
        AuthService.profileCache.delete(userId);
      }
    }
    for (const [userId, entry] of AuthService.userCache.entries()) {
      if (entry.user?.role?.id === roleId) {
        AuthService.userCache.delete(userId);
      }
    }
  }

  static getCachedUser(userId: number): any | null {
    const entry = AuthService.userCache.get(userId);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.user;
    }
    return null;
  }

  static setCachedUser(userId: number, user: any, ttlMs: number = 300000): void {
    AuthService.userCache.set(userId, {
      user,
      expiresAt: Date.now() + ttlMs,
    });
  }

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RolePermission) private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserPermission) private userPermRepo: Repository<UserPermission>,
    private jwtService: JwtService,
    private config: ConfigService,
    private otpStore: OtpStore,
    private mailService: MailService,
  ) {}

  // ── VALIDATE (used by LocalStrategy) ──────────────────────
  async validateUser(email: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase(), is_deleted: false },
      relations: ['role'],
    });
    if (!user) return null;
    if (user.status !== 'active') return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    return { Id: user.id, Email: user.email, Name: user.name, role: user.role?.name };
  }

  // ── TOKEN GENERATION ──────────────────────────────────────
  async getToken(email: string) {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase(), is_deleted: false },
      relations: ['role'],
    });
    if (!user) throw new UnauthorizedException('User not found');

    await this.userRepo.update(user.id, { last_login_at: new Date() });
    AuthService.invalidateProfileCache(user.id);

    const payload = {
      sub: user.id,
      Email: user.email,
      Name: user.name,
      role: user.role?.name ?? null,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    const permissions = await this.getUserPermissions(user.id, user.role_id);

    return {
      accessToken,
      refreshToken,
      user: {
        Id: user.id,
        Email: user.email,
        Name: user.name,
        role: user.role?.name ?? null,
        permissions,
      },
    };
  }

  // ── SIGNUP ────────────────────────────────────────────────
  async signup(dto: AuthDto): Promise<string> {
    const exists = await this.userRepo.findOne({
      where: { email: dto.Email.toLowerCase() },
    });
    if (exists) {
      if (exists.status === 'active') throw new ConflictException('Email already registered');
      // Resend OTP for pending users
    }

    if (!exists) {
      // Pre-create inactive user
      const hashed = await bcrypt.hash(dto.Password, 12);
      await this.userRepo.save(
        this.userRepo.create({
          username: dto.Email.split('@')[0],
          name: dto.Name ?? dto.Email.split('@')[0],
          email: dto.Email.toLowerCase(),
          password: hashed,
          status: 'inactive', // activated after OTP verify
        }),
      );
    }

    const otp = this.otpStore.generate(dto.Email);
    this.logger.warn(
      `\n---------------------------------------------\n` +
      `[SIMULATED EMAIL] To: ${dto.Email}\n` +
      `Subject: Verify Your Email\n` +
      `OTP Code: ${otp}\n` +
      `---------------------------------------------`
    );

    // In dev, return OTP directly so you can test without real SMTP
    if (this.config.get('NODE_ENV') !== 'production') return otp;
    return '******'; // hide in production
  }

  // ── SIGNUP VERIFY ─────────────────────────────────────────
  async signupVerify(dto: SignupVerifyDTO): Promise<void> {
    const valid = this.otpStore.verify(dto.Email, dto.VerificationNo);
    if (!valid) throw new BadRequestException('Invalid or expired OTP');

    const user = await this.userRepo.findOne({ where: { email: dto.Email.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepo.update(user.id, { status: 'active' });
  }

  // ── GET FULL PROFILE ──────────────────────────────────────
  async getProfile(userId: number) {
    // 1. Check valid cache
    const cached = AuthService.profileCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.profile;
    }

    // 2. Check if a fetch is already in-flight for this user to collapse parallel requests
    let promise = AuthService.profileInFlight.get(userId);
    if (!promise) {
      promise = (async () => {
        try {
          const user = await this.userRepo.findOne({
            where: { id: userId, is_deleted: false },
            relations: ['role'],
          });
          if (!user) throw new NotFoundException('User not found');

          // Load role permissions with full permission objects
          const rolePermissions = user.role_id
            ? await this.rolePermRepo.find({
                where: { role_id: user.role_id },
                relations: ['permission'],
              })
            : [];

          // Load user-level overrides
          const userPermissions = await this.userPermRepo.find({
            where: { user_id: userId },
            relations: ['permission'],
          });

          // Build enriched permission map — user overrides take priority over role
          const permMap = new Map<string, {
            code: string;
            module: string;
            description: string;
            allowed: boolean;
            source: 'role' | 'user_override';
          }>();

          rolePermissions.forEach((rp) => {
            if (rp.permission) {
              permMap.set(rp.permission.code, {
                code: rp.permission.code,
                module: rp.permission.module,
                description: rp.permission.description,
                allowed: true,
                source: 'role',
              });
            }
          });

          // User-level overrides win over role permissions
          userPermissions.forEach((up) => {
            if (up.permission) {
              permMap.set(up.permission.code, {
                code: up.permission.code,
                module: up.permission.module,
                description: up.permission.description,
                allowed: up.allowed,
                source: 'user_override',
              });
            }
          });

          const allPermissions = [...permMap.values()];

          // Group by module for the settings/permissions UI
          const byModule = allPermissions.reduce<Record<string, typeof allPermissions>>((acc, p) => {
            if (!acc[p.module]) acc[p.module] = [];
            acc[p.module].push(p);
            return acc;
          }, {});

          // Flat list of allowed permission codes for quick frontend checks
          const allowed = allPermissions.filter((p) => p.allowed).map((p) => p.code);

          const profile = {
            // ── Identity ────────────────────────────────────────
            Id: user.id,
            username: user.username,
            Name: user.name,
            Email: user.email,
            mobile_number: user.mobile_number ?? null,
            status: user.status,

            // ── Role ────────────────────────────────────────────
            role: user.role
              ? {
                  id: user.role.id,
                  name: user.role.name,
                  description: user.role.description,
                }
              : null,

            // ── Permissions ─────────────────────────────────────
            permissions: {
              // Flat array — use for quick checks:
              // permissions.allowed.includes('orders.create')
              allowed,

              // Grouped by module — use for permissions management UI
              by_module: byModule,

              // Full list with source info — use for audit/settings page
              all: allPermissions,
            },

            // ── Activity ────────────────────────────────────────
            last_login_at: user.last_login_at ?? null,
            created_at: user.created_at,
            updated_at: user.updated_at,
          };

          // Cache the resolved profile for 5 minutes
          AuthService.profileCache.set(userId, {
            profile,
            expiresAt: Date.now() + 300_000,
          });

          return profile;
        } finally {
          AuthService.profileInFlight.delete(userId);
        }
      })();

      AuthService.profileInFlight.set(userId, promise);
    }

    return promise;
  }

  // ── GOOGLE SIGNUP / LOGIN ─────────────────────────────────
  async googleSignup(email: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      user = await this.userRepo.save(
        this.userRepo.create({
          username: email.split('@')[0],
          name: email.split('@')[0],
          email: email.toLowerCase(),
          password: await bcrypt.hash(Math.random().toString(36), 12), // random pw
          status: 'active', // Google accounts are pre-verified
        }),
      );
    } else if (user.status !== 'active') {
      await this.userRepo.update(user.id, { status: 'active' });
      user.status = 'active';
    }
    return user;
  }

  // ── CHANGE PASSWORD ───────────────────────────────────────
  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId, is_deleted: false } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.CurrentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(dto.NewPassword, 12);
    await this.userRepo.update(userId, { password: hashed });
  }

  // ── PASSWORD RESET REQUEST ────────────────────────────────
  async passwordResetRequest(dto: PasswordResetRequestDTO): Promise<string> {
    const user = await this.userRepo.findOne({ where: { email: dto.Email.toLowerCase(), is_deleted: false } });
    if (!user) throw new NotFoundException('No account found with this email');

    const otp = this.otpStore.generate(dto.Email);
    await this.mailService.sendPasswordResetOtp(user.email, otp, user.name);

    if (this.config.get('NODE_ENV') !== 'production') return otp;
    return '******';
  }

  // ── PASSWORD RESET VERIFY ─────────────────────────────────
  async passwordResetVerify(dto: SignupVerifyDTO): Promise<void> {
    const valid = this.otpStore.verify(dto.Email, dto.VerificationNo);
    if (!valid) throw new BadRequestException('Invalid or expired OTP');
  }

  // ── RESET PASSWORD TOKEN ──────────────────────────────────
  getResetPasswordToken(dto: SignupVerifyDTO): string {
    return this.jwtService.sign(
      { Email: dto.Email, VerificationNo: dto.VerificationNo },
      {
        secret: this.config.get('JWT_RESET_SECRET'),
        expiresIn: this.config.get('JWT_RESET_EXPIRES_IN', '15m'),
      },
    );
  }

  // ── PASSWORD RESET ────────────────────────────────────────
  async passwordReset(dto: PasswordResetDTO): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email: dto.Email.toLowerCase(), is_deleted: false } });
    if (!user) throw new NotFoundException('User not found');

    const hashed = await bcrypt.hash(dto.NewPassword, 12);
    await this.userRepo.update(user.id, { password: hashed });
  }

  // ── UPDATE PROFILE ───────────────────────────────────────────
  /**
   * PATCH /auth/profile
   * নিজের profile update — শুধু safe fields।
   *
   * ✅ পারবে  : name, mobile_number, password (current চেক করে)
   * ❌ পারবে না: role_id, status, email, username — DTO তেই নেই
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId, is_deleted: false } });
    if (!user) throw new NotFoundException('User not found');
 
    // Password change করতে চাইলে current_password অবশ্যই দিতে হবে
    if (dto.new_password) {
      if (!dto.current_password) {
        throw new BadRequestException('নতুন password দিতে হলে current_password দিতে হবে।');
      }
      const isValid = await bcrypt.compare(dto.current_password, user.password);
      if (!isValid) {
        throw new ForbiddenException('Current password ভুল।');
      }
      user.password = await bcrypt.hash(dto.new_password, 12);
    }
 
    // শুধু safe fields update করো
    if (dto.name)          user.name          = dto.name;
    if (dto.mobile_number) user.mobile_number = dto.mobile_number;
 
    await this.userRepo.save(user);
 
    // password বাদ দিয়ে return
    const { password, ...safeUser } = user as any;
    return safeUser;
  }
 

  // PERMISSIONS HELPER 
  async getUserPermissions(userId: number, roleId: number): Promise<string[]> {
    const [rolePerms, userPerms] = await Promise.all([
      roleId
        ? this.rolePermRepo.find({ where: { role_id: roleId }, relations: ['permission'] })
        : Promise.resolve([]),
      this.userPermRepo.find({ where: { user_id: userId }, relations: ['permission'] }),
    ]);

    const permMap = new Map<string, boolean>();
    rolePerms.forEach((rp) => { if (rp.permission) permMap.set(rp.permission.code, true); });
    userPerms.forEach((up) => { if (up.permission) permMap.set(up.permission.code, up.allowed); });

    return [...permMap.entries()].filter(([, v]) => v).map(([k]) => k);
  }

  // ── ADMIN PASSWORD RESET (EMAIL/OTP BASED) ──────────────────────
  private adminResetOtps = new Map<string, { otp: string; expiresAt: number }>();

  async adminResetPasswordRequest(dto: { identifier: string }) {
    const identifier = dto.identifier.trim();
    const isEmail = identifier.includes('@');

    const user = await this.userRepo.findOne({
      where: isEmail
        ? { email: identifier.toLowerCase(), is_deleted: false }
        : { mobile_number: identifier, is_deleted: false },
    });

    if (!user) {
      throw new NotFoundException('Account not found with the provided email or identifier');
    }

    if (!user.email) {
      throw new BadRequestException('No email address is linked to this account.');
    }

    // Generate a secure 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    // Store under both identifier and email for reliable lookup
    this.adminResetOtps.set(identifier.toLowerCase(), { otp, expiresAt });
    this.adminResetOtps.set(user.email.toLowerCase(), { otp, expiresAt });

    // Send OTP via Nodemailer
    await this.mailService.sendPasswordResetOtp(user.email, otp, user.name);

    return {
      message: `Password reset OTP has been sent to your email (${user.email}) successfully`,
      identifier: user.email,
    };
  }

  async adminResetPasswordVerify(dto: { identifier: string; otp: string }) {
    const key = dto.identifier.trim().toLowerCase();
    const entry = this.adminResetOtps.get(key);

    if (!entry || Date.now() > entry.expiresAt || String(entry.otp) !== String(dto.otp)) {
      if (entry && Date.now() > entry.expiresAt) {
        this.adminResetOtps.delete(key);
      }
      throw new BadRequestException('Invalid or expired OTP');
    }

    return {
      message: 'OTP verified successfully',
      identifier: dto.identifier,
      otp: dto.otp,
    };
  }

  async adminResetPasswordSubmit(dto: { identifier: string; otp: string; password: string }) {
    const key = dto.identifier.trim().toLowerCase();
    const entry = this.adminResetOtps.get(key);

    if (!entry || Date.now() > entry.expiresAt || String(entry.otp) !== String(dto.otp)) {
      if (entry && Date.now() > entry.expiresAt) {
        this.adminResetOtps.delete(key);
      }
      throw new BadRequestException('Invalid or expired OTP session');
    }

    const isEmail = dto.identifier.includes('@');
    const user = await this.userRepo.findOne({
      where: isEmail
        ? { email: dto.identifier.toLowerCase(), is_deleted: false }
        : { mobile_number: dto.identifier, is_deleted: false },
    });

    if (!user) {
      throw new NotFoundException('Account not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    user.password = hashedPassword;
    user.status = 'active';
    await this.userRepo.save(user);

    // Clear OTP
    this.adminResetOtps.delete(key);

    return {
      message: 'Password set successfully',
    };
  }
}
