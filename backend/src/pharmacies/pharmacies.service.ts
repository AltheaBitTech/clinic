import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  CompletePharmacyInviteDto,
  CreatePharmacyDto,
  UpdatePharmacyDto,
} from './dto/pharmacy.dto';

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class PharmaciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePharmacyDto) {
    return this.prisma.pharmacy.create({
      data: {
        tenantId,
        ...dto,
      },
    });
  }

  async findAll(tenantId: string, search?: string) {
    return this.prisma.pharmacy.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { ownerName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const pharmacy = await this.prisma.pharmacy.findFirst({
      where: { id, tenantId },
    });
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');
    return pharmacy;
  }

  async update(id: string, tenantId: string, dto: UpdatePharmacyDto) {
    await this.findOne(id, tenantId);
    return this.prisma.pharmacy.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.pharmacy.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createInvite(tenantId: string) {
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);
    const invite = await this.prisma.pharmacyInvite.create({
      data: { tenantId, expiresAt },
    });
    return { token: invite.token, expiresAt: invite.expiresAt };
  }

  private async getValidInvite(token: string) {
    const invite = await this.prisma.pharmacyInvite.findUnique({
      where: { token },
      include: { tenant: { select: { id: true, name: true } } },
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
    return { tenantName: invite.tenant.name };
  }

  async completeInvite(token: string, dto: CompletePharmacyInviteDto) {
    const invite = await this.getValidInvite(token);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const {
      firstName,
      lastName,
      password: _password,
      ...pharmacyFields
    } = dto;

    const pharmacy = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName,
          lastName,
          role: UserRole.PHARMACY,
          tenantId: invite.tenantId,
          isActive: true,
          isVerified: true,
        },
      });

      const pharmacy = await tx.pharmacy.create({
        data: {
          tenantId: invite.tenantId,
          userId: user.id,
          ...pharmacyFields,
        },
      });

      await tx.pharmacyInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      return pharmacy;
    });

    return pharmacy;
  }

  async getMine(userId: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { userId },
    });
    if (!pharmacy) throw new NotFoundException('Pharmacy profile not found');
    return pharmacy;
  }

  async updateMine(userId: string, dto: UpdatePharmacyDto) {
    const pharmacy = await this.getMine(userId);
    const { isActive: _isActive, ...rest } = dto;
    return this.prisma.pharmacy.update({
      where: { id: pharmacy.id },
      data: rest,
    });
  }
}
