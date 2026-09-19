import {
  Controller, Post, Body, UseGuards, Res, HttpCode,
  HttpStatus, Get, Request, Patch, ForbiddenException,
  Headers, Query,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ResetPasswordGuard } from './guards/reset-password.guard';
import { Public } from './decorators/public.decorator';
import { AuthDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignupVerifyDTO } from './dto/signup-verify.dto';
import { PasswordResetRequestDTO } from './dto/reset-password/password-reset-request.dto.';
import { PasswordResetDTO } from './dto/reset-password/password-reset.dto';
import { AuthUserDto } from './dto/auth-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ClientResetRequestDto, ClientResetVerifyDto, ClientResetSubmitDto } from './dto/client-reset.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  /** Sets httpOnly cookies for access + refresh tokens */
  private _setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
    requestedApplication: string,
  ) {
    const isAdmin = requestedApplication === 'admin';
    const isProd = process.env['NODE_ENV'] === 'production';

    res.cookie(isAdmin ? 'adminAccessToken' : 'accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      // sameSite: isProd ? 'strict' : 'lax',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie(isAdmin ? 'adminRefreshToken' : 'refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      // sameSite: isProd ? 'strict' : 'lax',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  // ── LOGIN ─────────────────────────────────────────────────
  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with email & password → sets httpOnly cookies' })
  @ApiHeader({ name: 'requested-application', description: 'admin | client', required: false })
  @ApiResponse({ status: 200, description: 'Returns user object; sets access + refresh cookies' })
  async login(
    @Request() req: Request & { user: AuthUserDto },
    @Res({ passthrough: true }) res: Response,
    @Headers('requested-application') requestedApplication = 'client',
  ) {
    const tokens = await this.authService.getToken(req.user.Email);
    this._setAuthCookies(res, tokens, requestedApplication);
    return { user: tokens.user };
  }

  // ── REFRESH ───────────────────────────────────────────────
  @Post('refresh')
  @Public()
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  @ApiHeader({ name: 'requested-application', required: false })
  async refresh(
    @Request() req: Request & { user: AuthUserDto },
    @Res({ passthrough: true }) res: Response,
    @Headers('requested-application') requestedApplication = 'client',
  ) {
    const tokens = await this.authService.getToken(req.user.Email);
    this._setAuthCookies(res, tokens, requestedApplication);
    return { message: 'Token refreshed' };
  }

  // ── LOGOUT ────────────────────────────────────────────────
  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear auth cookies' })
  @ApiHeader({ name: 'requested-application', required: false })
  logout(
    @Res({ passthrough: true }) res: Response,
    @Headers('requested-application') requestedApplication = 'client',
  ) {
    const isAdmin = requestedApplication === 'admin';
    res.clearCookie(isAdmin ? 'adminAccessToken' : 'accessToken');
    res.clearCookie(isAdmin ? 'adminRefreshToken' : 'refreshToken');
    return { message: 'Logged out successfully' };
  }

  // ── SIGNUP ────────────────────────────────────────────────
  @Post('signup')
  @Public()
  @ApiOperation({ summary: 'Register new account → sends OTP to email' })
  @ApiResponse({ status: 201, description: 'OTP sent. VerificationNo returned in dev mode.' })
  async signup(@Body() authDto: AuthDto) {
    const VerificationNo = await this.authService.signup(authDto);
    return {
      message: 'An OTP has been sent to your email. Please verify to confirm your identity.',
      VerificationNo,
    };
  }

  // ── SIGNUP VERIFY ─────────────────────────────────────────
  @Post('signup/verify')
  @Public()
  @ApiOperation({ summary: 'Verify OTP → activates account + sets auth cookies' })
  @ApiHeader({ name: 'requested-application', required: false })
  async signupVerify(
    @Body() signupVerifyDto: SignupVerifyDTO,
    @Res({ passthrough: true }) res: Response,
    @Headers('requested-application') requestedApplication = 'client',
  ) {
    await this.authService.signupVerify(signupVerifyDto);
    const tokens = await this.authService.getToken(signupVerifyDto.Email);
    this._setAuthCookies(res, tokens, requestedApplication);
    return { user: tokens.user };
  }

  // ── PROFILE ───────────────────────────────────────────────
  // @Get('profile')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Get current authenticated user' })
  // getProfile(@Request() req: Request & { user: AuthUserDto }) {
  //   return { user: req.user };
  // }

  // ── PROFILE ───────────────────────────────────────────────
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user full profile',
    description: `Returns complete user data including:
- **Identity**: id, username, name, email, mobile_number, status
- **Role**: id, name, description
- **Permissions**:
  - \`allowed\`: flat array of permission codes for quick frontend checks
  - \`by_module\`: grouped by module for settings/permissions UI
  - \`all\`: full list with source (role vs user_override) and allowed flag
- **Activity**: last_login_at, created_at, updated_at`,
  })
  @ApiResponse({
    status: 200,
    description: 'Full user profile with role and permissions',
    schema: {
      example: {
        success: true,
        data: {
          id: 1,
          username: 'admin',
          name: 'Admin User',
          email: 'admin@acharshop.com',
          mobile_number: null,
          status: 'active',
          role: {
            id: 1,
            name: 'owner',
            description: 'Full system access — sees everything',
          },
          permissions: {
            allowed: [
              'dashboard.view', 'orders.view', 'orders.create',
              'orders.edit', 'orders.cancel', 'products.view',
              'inventory.view', 'finance.view', 'users.manage',
              '...all 25 permissions',
            ],
            by_module: {
              dashboard: [
                { code: 'dashboard.view', module: 'dashboard', description: 'View dashboard stats', allowed: true, source: 'role' },
              ],
              sales: [
                { code: 'orders.view', module: 'sales', description: 'View all orders', allowed: true, source: 'role' },
                { code: 'orders.create', module: 'sales', description: 'Create new orders', allowed: true, source: 'role' },
                { code: 'orders.edit', module: 'sales', description: 'Edit existing orders', allowed: true, source: 'role' },
              ],
              finance: [
                { code: 'finance.view', module: 'finance', description: 'View finance', allowed: false, source: 'user_override' },
              ],
            },
            all: [
              { code: 'dashboard.view', module: 'dashboard', allowed: true, source: 'role' },
              { code: 'finance.view', module: 'finance', allowed: false, source: 'user_override' },
            ],
          },
          last_login_at: '2026-01-15T10:30:00.000Z',
          created_at: '2025-09-01T00:00:00.000Z',
          updated_at: '2026-01-15T10:30:00.000Z',
        },
      },
    },
  })
  async getProfile(@Request() req: Request & { user: AuthUserDto }) {
    return this.authService.getProfile(req.user.Id);
  }

  // ── GOOGLE OAUTH ──────────────────────────────────────────
  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  async googleAuth() {
    // Passport redirects automatically
  }

  @Get('google/redirect')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback — creates/logs in user then redirects' })
  async googleAuthRedirect(
    @Request() req: { user: { email: string; name: string } },
    @Res({ passthrough: true }) res: Response,
    @Query('state') state?: string,
  ) {
    const stateObject = state
      ? (JSON.parse(decodeURIComponent(state)) as { app: string })
      : null;
    const app = stateObject?.app ?? 'client';

    const user = await this.authService.googleSignup(req.user.email);
    const tokens = await this.authService.getToken(user.email);
    this._setAuthCookies(res, tokens, app);

    const redirectUrl =
      app === 'admin'
        ? process.env['ADMIN_FRONTEND_BASE_URL']
        : process.env['FRONTEND_BASE_URL'];

    if (!redirectUrl) return { user: tokens.user };

    return res.redirect(
      `${redirectUrl}/auth/success?user=${encodeURIComponent(JSON.stringify(tokens.user))}`,
    );
  }


  // ── UPDATE PROFILE ───────────────────────────────────────────
  /**
   * PATCH /auth/profile
   * নিজের profile update — শুধু safe fields।
   *
   * ✅ name, mobile_number, password (current চেক করে)
   * ❌ role_id, status, email, username — পাঠালেও ignore হবে
   */
  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update own profile (safe fields only)',
    description: 'Update name, mobile_number, or password. role_id/status/email cannot be changed here.',
  })
  async updateProfile(
    @Request() req: Request & { user: AuthUserDto },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.Id, dto);
  }

  // ── CHANGE PASSWORD ───────────────────────────────────────
  @Patch('password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password (requires current password)' })
  async changePassword(
    @Request() req: Request & { user: AuthUserDto },
    @Body() data: ChangePasswordDto,
  ) {
    await this.authService.changePassword(req.user.Id, data);
    return { message: 'Password changed successfully' };
  }

  // ── PASSWORD RESET REQUEST ────────────────────────────────
  @Post('password/reset-request')
  @Public()
  @ApiOperation({ summary: 'Request password reset → sends OTP to email' })
  async passwordResetRequest(@Body() dto: PasswordResetRequestDTO) {
    const VerificationNo = await this.authService.passwordResetRequest(dto);
    return {
      message: 'An OTP has been sent to your email. Please verify to confirm your identity.',
      VerificationNo,
    };
  }

  // ── PASSWORD RESET VERIFY ─────────────────────────────────
  @Post('password/reset-verify')
  @Public()
  @ApiOperation({ summary: 'Verify OTP for password reset → sets short-lived reset cookie' })
  @ApiHeader({ name: 'requested-application', required: false })
  async passwordResetVerify(
    @Body() dto: SignupVerifyDTO,
    @Res({ passthrough: true }) res: Response,
    @Headers('requested-application') requestedApplication = 'client',
  ) {
    await this.authService.passwordResetVerify(dto);
    const passwordResetToken = this.authService.getResetPasswordToken(dto);

    const cookieName =
      requestedApplication === 'client' ? 'passwordResetToken' : 'adminPasswordResetToken';

    res.cookie(cookieName, passwordResetToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 min
    });

    return { message: 'OTP verified successfully. You can now reset your password.' };
  }

  // ── PASSWORD RESET ────────────────────────────────────────
  @Post('password/reset')
  @Public()
  @UseGuards(ResetPasswordGuard)
  @ApiOperation({ summary: 'Set new password using reset cookie' })
  async passwordReset(
    @Body() dto: PasswordResetDTO,
    @Request() req: Request & { user: { Id: number; Email: string; VerificationNo: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const reqData = req.user;
    const requestedApplication = (req.headers as any)['requested-application'] ?? 'client';

    if (reqData.Email !== dto.Email || reqData.VerificationNo !== dto.VerificationNo) {
      throw new ForbiddenException('Email in request does not match verification data.');
    }

    await this.authService.passwordReset(dto);

    res.clearCookie(
      requestedApplication === 'client' ? 'passwordResetToken' : 'adminPasswordResetToken',
    );

    return { message: 'Password has been reset successfully.' };
  }

  // ── ADMIN PASSWORD RESET (OTP BASED) ──────────────────────
  @Public()
  @Post('reset-password-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset/set OTP code for admin' })
  async adminResetPasswordRequest(@Body() dto: ClientResetRequestDto) {
    return this.authService.adminResetPasswordRequest(dto);
  }

  @Public()
  @Post('reset-password-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify reset password OTP code for admin' })
  async adminResetPasswordVerify(@Body() dto: ClientResetVerifyDto) {
    return this.authService.adminResetPasswordVerify(dto);
  }

  @Public()
  @Post('reset-password-submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit new password after OTP verification for admin' })
  async adminResetPasswordSubmit(@Body() dto: ClientResetSubmitDto) {
    return this.authService.adminResetPasswordSubmit(dto);
  }
}
