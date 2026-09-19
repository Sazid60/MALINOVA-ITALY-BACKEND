import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientAuthController } from './client-auth.controller';
import { ClientAuthService } from './client-auth.service';
import { OtpStore } from './otp.store';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { ClientJwtStrategy } from './strategies/client-jwt.strategy';
import { ClientJwtRefreshStrategy } from './strategies/client-jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { ResetPasswordStrategy } from './strategies/reset-password.strategy';
import { User } from '../users/user.entity';
import { RolePermission } from '../roles/role-permission.entity';
import { UserPermission } from '../users/user-permission.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RolePermission, UserPermission]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'secret'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '15m') },
      }),
      inject: [ConfigService],
    }),
    NotificationModule,
  ],
  controllers: [AuthController, ClientAuthController],
  providers: [
    AuthService,
    ClientAuthService,
    OtpStore,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    ClientJwtStrategy,
    ClientJwtRefreshStrategy,
    GoogleStrategy,
    ResetPasswordStrategy,
  ],
  exports: [AuthService, ClientAuthService, JwtModule],
})
export class AuthModule {}
