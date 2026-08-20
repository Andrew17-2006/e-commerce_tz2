import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { plainToInstance } from 'class-transformer';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './types/authenticated-user.interface';
import type { AppConfig } from '../config/configuration';
import { durationToMs } from '../common/utils/duration.util';

const REFRESH_COOKIE_NAME = 'refreshToken';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, refreshToken: string) {
    const jwtConfig = this.config.get<AppConfig>('app')!.jwt;
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
      maxAge: durationToMs(jwtConfig.refreshExpiresIn),
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    });
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...result } = await this.authService.register(dto.email, dto.password, dto.name);
    this.setRefreshCookie(res, refreshToken);
    return plainToInstance(AuthResponseDto, result, { excludeExtraneousValues: false });
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...result } = await this.authService.login(dto.email, dto.password);
    this.setRefreshCookie(res, refreshToken);
    return plainToInstance(AuthResponseDto, result, { excludeExtraneousValues: false });
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: AuthenticatedUser & { refreshToken: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.authService.refresh(user.userId, user.refreshToken);
    this.setRefreshCookie(res, refreshToken);
    return plainToInstance(AuthResponseDto, result, { excludeExtraneousValues: false });
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.userId);
    this.clearRefreshCookie(res);
  }
}
