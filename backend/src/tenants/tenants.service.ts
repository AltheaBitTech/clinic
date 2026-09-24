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
      this.config
        .get<string>('FRONTEND_URL')
        ?.split(',')[0]
        ?.trim()
        ?.replace(/\/+$/, '') || 'http://localhost:3000';

    try {
      await this.emailService.sendStaffInvite({
        recipientEmail: dto.email,
        hospitalName: tenant.name,
        role: dto.role,
        inviteUrl: `${frontendUrl}/register?token=${token}`,
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

  async getAnalytics(tenantId: string) {
    const now = new Date();

    const sevenDaysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
    );
    const [recentAppointments, departments, appointmentsByDoctor, doctors] =
      await Promise.all([
        this.prisma.appointment.findMany({
          where: { tenantId, scheduledAt: { gte: sevenDaysAgo } },
          select: { scheduledAt: true, status: true },
        }),
        this.prisma.department.findMany({
          where: { tenantId },
          select: { id: true, name: true },
        }),
        this.prisma.appointment.groupBy({
          by: ['doctorId'],
          where: { tenantId },
          _count: { doctorId: true },
        }),
        this.prisma.doctor.findMany({
          where: { tenantId },
          select: { id: true, departmentId: true },
        }),
      ]);

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const appointmentTrends = Array.from({ length: 7 }, (_, idx) => {
      const offset = 6 - idx;
      const dayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - offset,
      );
      const dayEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - offset + 1,
      );
      const dayAppointments = recentAppointments.filter(
        (a) => a.scheduledAt >= dayStart && a.scheduledAt < dayEnd,
      );
      return {
        name: dayLabels[dayStart.getDay()],
        Completed: dayAppointments.filter((a) => a.status === 'COMPLETED')
          .length,
        Scheduled: dayAppointments.filter(
          (a) => !['COMPLETED', 'CANCELLED'].includes(a.status),
        ).length,
      };
    });

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, createdAt: { gte: sixMonthsAgo } },
      select: { total: true, status: true, createdAt: true },
    });

    const monthLabels = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const financialTrends = Array.from({ length: 6 }, (_, idx) => {
      const offset = 5 - idx;
      const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthInvoices = invoices.filter(
        (inv) =>
          inv.createdAt.getFullYear() === monthDate.getFullYear() &&
          inv.createdAt.getMonth() === monthDate.getMonth(),
      );
      return {
        name: monthLabels[monthDate.getMonth()],
        Collected: monthInvoices
          .filter((inv) => inv.status === 'PAID')
          .reduce((sum, inv) => sum + Number(inv.total), 0),
        Unpaid: monthInvoices
          .filter((inv) => inv.status === 'PENDING')
          .reduce((sum, inv) => sum + Number(inv.total), 0),
      };
    });

    const deptCounts = new Map<string, number>();
    for (const entry of appointmentsByDoctor) {
      const doctor = doctors.find((d) => d.id === entry.doctorId);
      if (!doctor?.departmentId) continue;
      deptCounts.set(
        doctor.departmentId,
        (deptCounts.get(doctor.departmentId) || 0) + entry._count.doctorId,
      );
    }
    const totalDeptAppointments = Array.from(deptCounts.values()).reduce(
      (a, b) => a + b,
      0,
    );
    const deptColors = [
      'var(--primary)', 'var(--success)', 'var(--warning)',
      'var(--danger)', '#a855f7', '#0ea5e9',
    ];
    const departmentDistribution = departments
      .map((dept, idx) => {
        const count = deptCounts.get(dept.id) || 0;
        return {
          name: dept.name,
          count,
          value:
            totalDeptAppointments > 0
              ? Math.round((count / totalDeptAppointments) * 100)
              : 0,
          color: deptColors[idx % deptColors.length],
        };
      })
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      appointmentTrends,
      financialTrends,
      departmentDistribution,
    };
  }
}
