import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { AppConfig } from '../config/configuration';
import type { AuthenticatedUser } from './types/authenticated-user.interface';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Ця електронна адреса вже зареєстрована');
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.usersService.create({ email, passwordHash, name });
    this.logger.log(`New user registered: ${user.email}`);
    return this.issueTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      this.logger.warn(`Failed login attempt for ${email}`);
      throw new UnauthorizedException('Неправильний email або пароль');
    }
    this.logger.log(`User logged in: ${user.email}`);
    return this.issueTokens(user);
  }

  async refresh(userId: string, presentedRefreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Сесія закінчилася, увійдіть знову');
    }
    const matches = await bcrypt.compare(presentedRefreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Сесія закінчилася, увійдіть знову');
    }
    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  private async issueTokens(user: User) {
    const jwtConfig = this.config.get<AppConfig>('app')!.jwt;
    const payload: Omit<AuthenticatedUser, 'userId'> & { sub: string } = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.accessSecret,
        expiresIn: jwtConfig.accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.refreshSecret,
        expiresIn: jwtConfig.refreshExpiresIn,
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.usersService.setRefreshTokenHash(user.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }
}
