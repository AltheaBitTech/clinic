import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  AcceptInviteDto,
  SendRegisterEmailOtpDto,
  VerifyRegisterEmailOtpDto,
} from './dto/auth.dto';

const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_OTP_TTL_MINUTES = 10;
const EMAIL_OTP_MAX_ATTEMPTS = 5;
const EMAIL_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const REGISTER_EMAIL_PROOF_PURPOSE = 'register_email';
const REGISTER_EMAIL_PROOF_EXPIRES = '20m';
const EMAIL_DELIVERY_FAILURE_MESSAGE =
  'Unable to send verification email. Please try again later.';
const EMAIL_VERIFICATION_REQUIRED_MESSAGE = 'Email verification is required';
const EMAIL_VERIFICATION_INVALID_MESSAGE =
  'Email verification is invalid or has expired';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private readonly userRelationsInclude = {
    doctor: { include: { department: true } },
    patient: true,
    pharmacy: true,
    tenant: { select: { id: true, name: true, slug: true, logoUrl: true } },
  };

  async sendRegisterEmailOtp(dto: SendRegisterEmailOtpDto) {
    const email = this.normalizeEmail(dto.email);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const current = await this.prisma.emailRegistrationChallenge.findUnique({
      where: { email },
    });
    if (
      current?.lastSentAt &&
      Date.now() - current.lastSentAt.getTime() < EMAIL_OTP_RESEND_COOLDOWN_MS
    ) {
      throw new HttpException(
        'Please wait before requesting another verification code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const otpHash = await bcrypt.hash(otp, 12);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EMAIL_OTP_TTL_MS);

    await this.prisma.emailRegistrationChallenge.upsert({
      where: { email },
      create: {
        email,
        otpHash,
        expiresAt,
        lastSentAt: now,
        attemptCount: 0,
      },
      update: {
        otpHash,
        expiresAt,
        lastSentAt: now,
        attemptCount: 0,
        verifiedAt: null,
        consumedAt: null,
      },
    });

    try {
      await this.emailService.sendEmailVerificationOtp({
        recipientEmail: email,
        userName: dto.firstName,
        otp,
        expiresInMinutes: EMAIL_OTP_TTL_MINUTES,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Registration email OTP delivery failed: ${message}`);
      throw new ServiceUnavailableException(EMAIL_DELIVERY_FAILURE_MESSAGE);
    }

    return { message: 'Verification code sent successfully' };
  }

  async verifyRegisterEmailOtp(dto: VerifyRegisterEmailOtpDto) {
    const email = this.normalizeEmail(dto.email);
    const challenge = await this.prisma.emailRegistrationChallenge.findUnique({
      where: { email },
    });

    if (!challenge) throw new BadRequestException('Invalid OTP');
    if (challenge.consumedAt)
      throw new BadRequestException('OTP has already been used');
    if (challenge.verifiedAt)
      throw new BadRequestException('OTP has already been used');
    if (challenge.attemptCount >= EMAIL_OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Too many incorrect attempts. Request a new verification code',
      );
    }
    if (!challenge.expiresAt || new Date() > challenge.expiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    const isMatch = await bcrypt.compare(dto.otp, challenge.otpHash);
    if (!isMatch) {
      const nextAttempts = challenge.attemptCount + 1;
      await this.prisma.emailRegistrationChallenge.update({
        where: { id: challenge.id },
        data: { attemptCount: nextAttempts },
      });
      if (nextAttempts >= EMAIL_OTP_MAX_ATTEMPTS) {
        throw new BadRequestException(
          'Too many incorrect attempts. Request a new verification code',
        );
      }
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.emailRegistrationChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: new Date() },
    });

    const emailVerificationToken = await this.jwtService.signAsync(
      {
        purpose: REGISTER_EMAIL_PROOF_PURPOSE,
        email,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: REGISTER_EMAIL_PROOF_EXPIRES,
        jwtid: challenge.id,
      },
    );

    return { emailVerificationToken };
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });
    if (!tenant || !tenant.isActive)
      throw new BadRequestException('Selected hospital is not available');

    const challengeId = await this.assertRegisterEmailVerified(
      email,
      dto.emailVerificationToken,
    );

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.emailRegistrationChallenge.updateMany({
        where: {
          id: challengeId,
          verifiedAt: { not: null },
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException('Email verification is no longer valid');
      }

      const created = await tx.user.create({
        data: {
          email,
          phone: dto.phone || null,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          role: 'PATIENT',
          tenantId: dto.tenantId,
          isVerified: true,
        },
      });

      const patient = await tx.patient.create({
        data: {
          userId: created.id,
          tenantId: dto.tenantId,
          patientCode: `P${Date.now().toString().slice(-8)}`,
        },
      });

      await tx.patientTimeline.create({
        data: {
          patientId: patient.id,
          eventType: 'NOTE_ADDED',
          title: 'Patient Registered',
          description: 'Patient self-registered online',
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        include: this.userRelationsInclude,
      });
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    await this.trySendRegistrationWelcome({
      recipientEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      hospitalName: user.tenant?.name,
    });

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
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive)
      throw new UnauthorizedException('Account is deactivated');

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

    if (!user.otp || user.otp !== dto.otp)
      throw new BadRequestException('Invalid OTP');
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiresAt: null,
        isVerified: true,
        lastLoginAt: new Date(),
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access denied');

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
    if (new Date() > invite.expiresAt)
      throw new BadRequestException('Invite expired');

    const existing = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });
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

    await this.trySendRegistrationWelcome({
      recipientEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      hospitalName: user.tenant?.name ?? invite.tenant?.name,
    });

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

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private async assertRegisterEmailVerified(
    email: string,
    token?: string,
  ): Promise<string> {
    if (!token) {
      throw new BadRequestException(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
    }

    let payload: { purpose?: string; email?: string; jti?: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new BadRequestException(EMAIL_VERIFICATION_INVALID_MESSAGE);
    }

    if (
      payload.purpose !== REGISTER_EMAIL_PROOF_PURPOSE ||
      this.normalizeEmail(payload.email || '') !== email ||
      !payload.jti
    ) {
      throw new BadRequestException(EMAIL_VERIFICATION_INVALID_MESSAGE);
    }

    const challenge = await this.prisma.emailRegistrationChallenge.findUnique({
      where: { id: payload.jti },
    });
    if (
      !challenge ||
      this.normalizeEmail(challenge.email) !== email ||
      !challenge.verifiedAt ||
      challenge.consumedAt
    ) {
      throw new BadRequestException(EMAIL_VERIFICATION_INVALID_MESSAGE);
    }

    return challenge.id;
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, otp, otpExpiresAt, ...safe } = user;
    return safe;
  }

  private async trySendRegistrationWelcome(params: {
    recipientEmail: string;
    userName: string;
    role: string;
    hospitalName?: string | null;
  }) {
    try {
      await this.emailService.sendRegistrationWelcome({
        recipientEmail: params.recipientEmail,
        userName: params.userName,
        role: params.role,
        hospitalName: params.hospitalName || undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Registration welcome email failed (role=${params.role}, error=${message})`,
      );
    }
  }
}
