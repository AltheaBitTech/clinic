import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LabLinkStatus, TenantType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  CompletePathologyLabInviteDto,
  UpdatePathologyLabDto,
} from './dto/pathology-lab.dto';

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class PathologyLabsService {
  private readonly logger = new Logger(PathologyLabsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  /** Directory of active labs, browsable by hospital staff to pick one to link with. */
  async findAll(search?: string) {
    return this.prisma.pathologyLab.findMany({
      where: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const lab = await this.prisma.pathologyLab.findUnique({ where: { id } });
    if (!lab) throw new NotFoundException('Pathology lab not found');
    return lab;
  }

  async getMine(userId: string) {
    const lab = await this.prisma.pathologyLab.findUnique({
      where: { userId },
    });
    if (!lab) throw new NotFoundException('Pathology lab profile not found');
    return lab;
  }

  async updateMine(userId: string, dto: UpdatePathologyLabDto) {
    const lab = await this.getMine(userId);
    const { isActive: _isActive, ...rest } = dto;
    return this.prisma.pathologyLab.update({
      where: { id: lab.id },
      data: rest,
    });
  }

  /** Generate a one-time self-registration link a hospital sends to onboard a new, independent lab. */
  async createInvite(
    invitedByTenantId: string,
    invitedByUserId: string,
    email?: string,
  ) {
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);
    const invite = await this.prisma.pathologyLabInvite.create({
      data: { invitedByTenantId, invitedByUserId, email, expiresAt },
    });

    if (email) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: invitedByTenantId },
        select: { name: true },
      });
      const frontendUrl =
        this.config
          .get<string>('FRONTEND_URL')
          ?.split(',')[0]
          ?.trim()
          ?.replace(/\/+$/, '') || 'http://localhost:3000';

      try {
        await this.emailService.sendPathologyLabInvite({
          recipientEmail: email,
          hospitalName: tenant?.name || 'a hospital',
          inviteUrl: `${frontendUrl}/register/pathology-lab?token=${invite.token}`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this.logger.error(
          `Pathology lab invite email failed (inviteId=${invite.id}, error=${message})`,
        );
      }
    }

    return { token: invite.token, expiresAt: invite.expiresAt };
  }

  private async getValidInvite(token: string) {
    const invite = await this.prisma.pathologyLabInvite.findUnique({
      where: { token },
      include: { invitedByTenant: { select: { id: true, name: true } } },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.usedAt) throw new BadRequestException('Invite already used');
    if (new Date() > invite.expiresAt) {
      throw new BadRequestException('Invite expired');
    }
    return invite;
  }

  async getInvite(token: string) {
    const invite = await this.getValidInvite(token);
    return { tenantName: invite.invitedByTenant.name, email: invite.email };
  }

  /**
   * Completing an invite creates the lab's OWN tenant (PathologyLab.tenantId
   * is 1:1 with its tenant, so it can never be owned by the inviting
   * hospital) plus an ACTIVE HospitalLabLink back to the inviting hospital,
   * so it shows up already linked without a separate approval step.
   */
  async completeInvite(token: string, dto: CompletePathologyLabInviteDto) {
    const invite = await this.getValidInvite(token);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const { firstName, lastName, password: _password, ...labFields } = dto;

    let slug = labFields.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingTenant) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const lab = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          type: TenantType.PATHOLOGY,
          name: labFields.name,
          slug,
          email: dto.email,
          phone: labFields.phone,
          address: labFields.address,
          city: labFields.city,
          state: labFields.state,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName,
          lastName,
          role: UserRole.PATHOLOGY,
          tenantId: tenant.id,
          isActive: true,
          isVerified: true,
        },
      });

      const lab = await tx.pathologyLab.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          ...labFields,
        },
      });

      await tx.hospitalLabLink.create({
        data: {
          hospitalTenantId: invite.invitedByTenantId,
          labId: lab.id,
          status: LabLinkStatus.ACTIVE,
          requestedById: invite.invitedByUserId,
          respondedById: user.id,
          respondedAt: new Date(),
        },
      });

      await tx.pathologyLabInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      return lab;
    });

    try {
      await this.emailService.sendRegistrationWelcome({
        recipientEmail: dto.email,
        userName: `${firstName} ${lastName}`.trim(),
        role: UserRole.PATHOLOGY,
        hospitalName: invite.invitedByTenant.name,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Registration welcome email failed (labId=${lab.id}, error=${message})`,
      );
    }

    return lab;
  }
}
