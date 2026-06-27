import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Conta temporariamente bloqueada. Tente novamente mais tarde.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
      }
      await this.usersService.update(user.id, {
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil,
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.usersService.update(user.id, { loginAttempts: 0, lockedUntil: null });
    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    const stored = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    stored.isRevoked = true;
    await this.refreshTokenRepository.save(stored);

    const tokens = await this.generateTokens(stored.user);
    return tokens;
  }

  async logout(refreshToken: string) {
    await this.refreshTokenRepository.update(
      { token: refreshToken },
      { isRevoked: true },
    );
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES', '15m'),
    });

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    await this.refreshTokenRepository.save({
      token: refreshTokenString,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken: refreshTokenString };
  }

  private sanitizeUser(user: any) {
    const { password, loginAttempts, verificationToken, verificationTokenExpires, resetPasswordToken, resetPasswordTokenExpires, ...safe } = user;
    return safe;
  }
}
