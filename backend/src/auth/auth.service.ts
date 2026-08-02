import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto, VerifyOtpDto, AcceptInviteDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private readonly userRelationsInclude = {
    doctor: { include: { department: true } },
    patient: true,
    tenant: { select: { id: true, name: true, slug: true, logoUrl: true } },
  };

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone || null,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        isVerified: true, // For MVP, skip email verification
      },
      include: this.userRelationsInclude,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: this.userRelationsInclude,
    });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async sendOtp(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          email: `${phone.replace('+', '')}@otp.Arogyix.health`,
          firstName: 'Patient',
          lastName: '',
          otp,
          otpExpiresAt,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otp, otpExpiresAt },
      });
    }

    // TODO: Send OTP via Twilio SMS
    // In dev, log it
    console.log(`OTP for ${phone}: ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: this.userRelationsInclude,
    });
    if (!user) throw new NotFoundException('User not found');

    if (!user.otp || user.otp !== dto.otp) throw new BadRequestException('Invalid OTP');
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiresAt: null, isVerified: true, lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) throw new UnauthorizedException('Access denied');

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) throw new UnauthorizedException('Access denied');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const invite = await this.prisma.hospitalInvite.findUnique({
      where: { token: dto.token },
      include: { tenant: true },
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.usedAt) throw new BadRequestException('Invite already used');
    if (new Date() > invite.expiresAt) throw new BadRequestException('Invite expired');

    const existing = await this.prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: invite.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        role: invite.role,
        tenantId: invite.tenantId,
        isVerified: true,
      },
      include: this.userRelationsInclude,
    });

    await this.prisma.hospitalInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userRelationsInclude,
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  // ─── Helpers ──────────────────────────────

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, otp, otpExpiresAt, ...safe } = user;
    return safe;
  }
}
