import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientAuthService } from './client-auth.service';
import { ClientRegisterDto } from './dto/client-register.dto';
import { ClientLoginDto } from './dto/client-login.dto';
import { ClientJwtAuthGuard } from './guards/client-jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { multerConfig } from '../upload/multer.config';
import { Public } from './decorators/public.decorator';

@ApiTags('Client Authentication')
@Controller('client/auth')
export class ClientAuthController {
  constructor(
    private authService: ClientAuthService,
    private config: ConfigService,
  ) {}

  private _setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const isProd = this.config.get('NODE_ENV') === 'production';

    res.cookie('clientAccessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('clientRefreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiOperation({ summary: 'Register a new client account' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  async register(
    @Body() dto: ClientRegisterDto,
    @Res({ passthrough: true }) res: Response,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const tokens = await this.authService.register(dto, file);
    this._setAuthCookies(res, tokens);
    return { user: tokens.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login for clients' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(
    @Body() dto: ClientLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto);
    this._setAuthCookies(res, tokens);
    return { user: tokens.user };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout client and clear cookies' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('clientAccessToken');
    res.clearCookie('clientRefreshToken');
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Get('me')
  @UseGuards(ClientJwtAuthGuard)
  @ApiOperation({ summary: 'Get current logged-in client profile' })
  getProfile(@Req() req: Request & { user: any }) {
    return this.authService.getProfile(req.user.id);
  }
}
