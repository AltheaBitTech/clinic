import { Injectable } from '@nestjs/common';
import { LabOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PathologyReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private dateRange(from?: string, to?: string) {
    return {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  async revenue(labId: string, from?: string, to?: string) {
    const range = this.dateRange(from, to);
    const orders = await this.prisma.labOrder.findMany({
      where: {
        labId,
        status: { not: LabOrderStatus.CANCELLED },
        ...(Object.keys(range).length ? { createdAt: range } : {}),
      },
      select: { total: true, hospitalTenantId: true, createdAt: true },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const hospitalLinkedRevenue = orders
      .filter((o) => o.hospitalTenantId)
      .reduce((sum, o) => sum + Number(o.total), 0);

    return {
      orderCount: orders.length,
      totalRevenue,
      hospitalLinkedRevenue,
      walkInRevenue: totalRevenue - hospitalLinkedRevenue,
    };
  }

  async turnaroundTime(labId: string, from?: string, to?: string) {
    const range = this.dateRange(from, to);
    const orders = await this.prisma.labOrder.findMany({
      where: {
        labId,
        status: LabOrderStatus.REPORT_DELIVERED,
        reportDeliveredAt: { not: null },
        ...(Object.keys(range).length ? { createdAt: range } : {}),
      },
      select: { createdAt: true, reportDeliveredAt: true },
    });

    if (!orders.length) {
      return { sampleSize: 0, averageTurnaroundHours: null };
    }

    const totalHours = orders.reduce((sum, o) => {
      const hours =
        (o.reportDeliveredAt!.getTime() - o.createdAt.getTime()) /
        (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return {
      sampleSize: orders.length,
      averageTurnaroundHours:
        Math.round((totalHours / orders.length) * 10) / 10,
    };
  }

  /**
   * Per-order commission ledger for referring doctors — deliberately separate
   * from the tenant-level Referral/ReferralCommission payout system.
   */
  async commissions(
    labId: string,
    doctorId?: string,
    from?: string,
    to?: string,
  ) {
    const range = this.dateRange(from, to);
    const orders = await this.prisma.labOrder.findMany({
      where: {
        labId,
        commissionAmount: { not: null },
        status: {
          in: [LabOrderStatus.VERIFIED, LabOrderStatus.REPORT_DELIVERED],
        },
        ...(doctorId ? { referringDoctorId: doctorId } : {}),
        ...(Object.keys(range).length ? { createdAt: range } : {}),
      },
      select: {
        id: true,
        orderNo: true,
        referringDoctorId: true,
        referringDoctorName: true,
        commissionPercent: true,
        commissionAmount: true,
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const byDoctor = new Map<
      string,
      {
        doctorId: string | null;
        doctorName: string | null;
        totalCommission: number;
        orderCount: number;
      }
    >();
    for (const order of orders) {
      const key =
        order.referringDoctorId || order.referringDoctorName || 'unknown';
      const entry = byDoctor.get(key) ?? {
        doctorId: order.referringDoctorId,
        doctorName: order.referringDoctorName,
        totalCommission: 0,
        orderCount: 0,
      };
      entry.totalCommission += Number(order.commissionAmount ?? 0);
      entry.orderCount += 1;
      byDoctor.set(key, entry);
    }

    return {
      orders,
      summary: Array.from(byDoctor.values()),
    };
  }
}
