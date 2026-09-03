import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  InviteUserDto,
} from './dto/tenant.dto';
import { randomUUID } from 'crypto';
import { TenantType } from '@prisma/client';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private config: ConfigService,
  ) {}

  async create(dto: CreateTenantDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Tenant slug already exists');

    return this.prisma.tenant.create({ data: { ...dto, slug } });
  }

  async findPublic(search?: string) {
    const where: any = { isActive: true, type: TenantType.HOSPITAL };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.tenant.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 50,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        state: true,
        logoUrl: true,
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true, patients: true, appointments: true },
          },
        },
      }),
      this.prisma.tenant.count(),
    ]);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        departments: true,
        _count: { select: { users: true, patients: true, appointments: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.delete({ where: { id } });
  }

  async inviteUser(tenantId: string, dto: InviteUserDto) {
    const tenant = await this.findOne(tenantId);

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.hospitalInvite.create({
      data: {
        tenantId,
        email: dto.email,
        role: dto.role,
        token,
        expiresAt,
      },
    });

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL')?.trim() ||
      'http://localhost:3000';

    try {
      await this.emailService.sendStaffInvite({
        recipientEmail: dto.email,
        hospitalName: tenant.name,
        role: dto.role,
        inviteUrl: `${frontendUrl}/invite/${token}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Staff invite email failed (tenantId=${tenantId}, error=${message})`,
      );
    }

    return { message: 'Invite sent', inviteToken: token };
  }

  async getStats(tenantId: string) {
    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      pendingInvoices,
    ] = await Promise.all([
      this.prisma.doctor.count({ where: { tenantId } }),
      this.prisma.patient.count({ where: { tenantId } }),
      this.prisma.appointment.count({ where: { tenantId } }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.invoice.count({ where: { tenantId, status: 'PENDING' } }),
    ]);

    return {
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      pendingInvoices,
    };
  }
}
