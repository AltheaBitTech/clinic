import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSuperAdminDashboard() {
    const [totalTenants, totalUsers, totalPatients, totalAppointments] =
      await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.user.count(),
        this.prisma.patient.count(),
        this.prisma.appointment.count(),
      ]);

    const recentTenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        createdAt: true,
        isActive: true,
      },
    });

    return {
      totalTenants,
      totalUsers,
      totalPatients,
      totalAppointments,
      recentTenants,
    };
  }

  async getHospitalAdminDashboard(tenantId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      todayAppointments,
      totalPatients,
      totalDoctors,
      pendingPayments,
      todayRevenue,
      missedFollowUps,
      recentPatients,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { tenantId, scheduledAt: { gte: startOfDay, lte: endOfDay } },
      }),
      this.prisma.patient.count({ where: { tenantId } }),
      this.prisma.doctor.count({ where: { tenantId } }),
      this.prisma.invoice.count({ where: { tenantId, status: 'PENDING' } }),
      this.prisma.invoice.aggregate({
        where: { tenantId, status: 'PAID', paidAt: { gte: startOfDay } },
        _sum: { total: true },
      }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          followUpDate: { lt: new Date() },
        },
      }),
      this.prisma.patient.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: { firstName: true, lastName: true, avatarUrl: true },
          },
        },
      }),
    ]);

    const appointmentsByStatus = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: { tenantId, scheduledAt: { gte: startOfDay, lte: endOfDay } },
      _count: { status: true },
    });

    return {
      todayAppointments,
      totalPatients,
      totalDoctors,
      pendingPayments,
      todayRevenue: todayRevenue._sum.total || 0,
      missedFollowUps,
      recentPatients,
      appointmentsByStatus,
    };
  }

  async getDoctorDashboard(tenantId: string, doctorId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [todayAppts, totalPatients, pendingPrescriptions, recentAppts] =
      await Promise.all([
        this.prisma.appointment.count({
          where: {
            tenantId,
            doctorId,
            scheduledAt: { gte: startOfDay, lte: endOfDay },
            status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
          },
        }),
        this.prisma.appointment.groupBy({
          by: ['patientId'],
          where: { tenantId, doctorId },
          _count: { patientId: true },
        }),
        this.prisma.appointment.count({
          where: {
            tenantId,
            doctorId,
            status: 'COMPLETED',
            prescriptions: { none: {} },
          },
        }),
        this.prisma.appointment.findMany({
          where: {
            tenantId,
            doctorId,
            scheduledAt: { gte: startOfDay, lte: endOfDay },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 10,
          include: {
            patient: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, avatarUrl: true },
                },
              },
            },
          },
        }),
      ]);

    return {
      todayAppointments: todayAppts,
      totalPatients: totalPatients.length,
      pendingPrescriptions,
      todaySchedule: recentAppts,
    };
  }

  async getPatientDashboard(patientId: string) {
    const [upcomingAppts, activeMedicines, recentReports, recentPrescriptions] =
      await Promise.all([
        this.prisma.appointment.findMany({
          where: {
            patientId,
            scheduledAt: { gte: new Date() },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 3,
          include: {
            doctor: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, avatarUrl: true },
                },
              },
            },
          },
        }),
        this.prisma.medicineReminder.findMany({
          where: {
            patientId,
            status: 'PENDING',
            scheduledAt: { gte: new Date() },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 5,
          include: { medicine: true },
        }),
        this.prisma.report.findMany({
          where: { patientId },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        this.prisma.prescription.findMany({
          where: { patientId },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            medicines: true,
            doctor: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        }),
      ]);

    return {
      upcomingAppointments: upcomingAppts,
      activeMedicines,
      recentReports,
      recentPrescriptions,
    };
  }

  async getReceptionistDashboard(tenantId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      todayAppointments,
      checkedInAppointments,
      pendingAppointments,
      completedAppointments,
      totalPatients,
      pendingPayments,
      todayRevenue,
      todaySchedule,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { tenantId, scheduledAt: { gte: startOfDay, lte: endOfDay } },
      }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          OR: [
            { status: 'IN_PROGRESS' },
            { checkedInAt: { not: null }, status: { not: 'CANCELLED' } },
          ],
        },
      }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          checkedInAt: null,
        },
      }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          status: 'COMPLETED',
        },
      }),
      this.prisma.patient.count({ where: { tenantId } }),
      this.prisma.invoice.count({ where: { tenantId, status: 'PENDING' } }),
      this.prisma.invoice.aggregate({
        where: { tenantId, status: 'PAID', paidAt: { gte: startOfDay } },
        _sum: { total: true },
      }),
      this.prisma.appointment.findMany({
        where: { tenantId, scheduledAt: { gte: startOfDay, lte: endOfDay } },
        orderBy: { scheduledAt: 'asc' },
        include: {
          patient: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
          doctor: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          invoice: { select: { id: true, status: true, total: true } },
        },
      }),
    ]);

    return {
      todayAppointments,
      checkedInAppointments,
      pendingAppointments,
      completedAppointments,
      totalPatients,
      pendingPayments,
      todayRevenue: todayRevenue._sum.total || 0,
      todaySchedule,
    };
  }
}
