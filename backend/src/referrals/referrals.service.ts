import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuthService } from '../auth/auth.service';
import { RegisterReferralDto } from './dto/register-referral.dto';
import { UpdateReferralProfileDto } from './dto/update-referral-profile.dto';
import { RequestStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const REFERRAL_CODE_MAX_ATTEMPTS = 5;

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private authService: AuthService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async register(dto: RegisterReferralDto) {
    const email = this.normalizeEmail(dto.email);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const challengeId = await this.authService.assertRegisterEmailVerified(
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
          role: UserRole.REFERRAL,
          tenantId: null,
          isActive: false,
          isVerified: true,
        },
      });

      await tx.referral.create({
        data: {
          userId: created.id,
          status: RequestStatus.PENDING,
          phone: dto.phone || null,
          address: dto.address,
          city: dto.city,
          state: dto.state,
        },
      });

      return created;
    });

    try {
      const superAdmins = await this.prisma.user.findMany({
        where: { role: UserRole.SUPER_ADMIN, isActive: true },
        select: { email: true },
      });
      await Promise.all(
        superAdmins.map((admin) =>
          this.emailService.sendReferralRequestSubmitted({
            recipientEmail: admin.email,
            applicantName: `${user.firstName} ${user.lastName}`.trim(),
          }),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Referral request submitted email failed (userId=${user.id}, error=${message})`,
      );
    }

    return {
      message: 'Referral signup submitted and is awaiting Super Admin approval',
    };
  }

  async findAll(status?: RequestStatus) {
    return this.prisma.referral.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMe(userId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { userId },
    });
    if (!referral) throw new NotFoundException('Referral profile not found');
    return referral;
  }

  async updateMe(userId: string, dto: UpdateReferralProfileDto) {
    const referral = await this.prisma.referral.findUnique({
      where: { userId },
    });
    if (!referral) throw new NotFoundException('Referral profile not found');

    return this.prisma.referral.update({
      where: { userId },
      data: {
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
      },
    });
  }

  private async generateUniqueReferralCode(): Promise<string> {
    for (let attempt = 0; attempt < REFERRAL_CODE_MAX_ATTEMPTS; attempt++) {
      const code = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const existing = await this.prisma.referral.findUnique({
        where: { referralCode: code },
      });
      if (!existing) return code;
    }
    throw new BadRequestException(
      'Unable to generate a unique referral code, please try again',
    );
  }

  async approve(id: string, approverId: string) {
    const referral = await this.prisma.referral.findUnique({ where: { id } });
    if (!referral) throw new NotFoundException('Referral request not found');
    if (referral.status === RequestStatus.APPROVED) {
      throw new BadRequestException('Referral has already been approved');
    }

    const referralCode =
      referral.referralCode ?? (await this.generateUniqueReferralCode());

    const [, updatedReferral] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: referral.userId },
        data: { isActive: true },
      }),
      this.prisma.referral.update({
        where: { id },
        data: {
          status: RequestStatus.APPROVED,
          referralCode,
          approvedAt: new Date(),
          approvedById: approverId,
          rejectedAt: null,
          rejectedById: null,
        },
      }),
    ]);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: referral.userId },
      });
      if (user) {
        await this.emailService.sendReferralApproved({
          recipientEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`.trim(),
          referralCode,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Referral approved email failed (referralId=${id}, error=${message})`,
      );
    }

    return updatedReferral;
  }

  async reject(id: string, rejecterId: string) {
    const referral = await this.prisma.referral.findUnique({ where: { id } });
    if (!referral) throw new NotFoundException('Referral request not found');
    if (referral.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Referral has already been ${referral.status.toLowerCase()}`,
      );
    }

    const updated = await this.prisma.referral.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedById: rejecterId,
      },
    });

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: referral.userId },
      });
      if (user) {
        await this.emailService.sendReferralRejected({
          recipientEmail: user.email,
          applicantName: `${user.firstName} ${user.lastName}`.trim(),
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Referral rejected email failed (referralId=${id}, error=${message})`,
      );
    }

    return updated;
  }
}
