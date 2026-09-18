import { Injectable } from '@nestjs/common';
import { LabLinkStatus, LabOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const NOT_FINALIZED: LabOrderStatus[] = [
  LabOrderStatus.ORDERED,
  LabOrderStatus.SAMPLE_SCHEDULED,
  LabOrderStatus.SAMPLE_COLLECTED,
  LabOrderStatus.RECEIVED_AT_LAB,
  LabOrderStatus.ACCEPTED,
  LabOrderStatus.IN_PROGRESS,
  LabOrderStatus.RESULT_READY,
  LabOrderStatus.PENDING_VERIFICATION,
];

@Injectable()
export class PathologyDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(labId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      todaysOrders,
      samplesPendingCollection,
      samplesReceived,
      processing,
      pendingResults,
      pendingVerification,
      reportsFinalizedToday,
      reportsDeliveredToday,
      criticalUnacknowledged,
      rejectedSamples,
      recollectionRequested,
      activeHospitalLinks,
      deliveredForTat,
      pendingWork,
    ] = await Promise.all([
      this.prisma.labOrder.findMany({
        where: { labId, createdAt: { gte: startOfDay } },
        select: { total: true },
      }),
      this.prisma.labOrder.count({
        where: {
          labId,
          status: {
            in: [LabOrderStatus.ORDERED, LabOrderStatus.SAMPLE_SCHEDULED],
          },
        },
      }),
      this.prisma.labOrder.count({
        where: {
          labId,
          status: { in: [LabOrderStatus.RECEIVED_AT_LAB, LabOrderStatus.ACCEPTED] },
        },
      }),
      this.prisma.labOrder.count({
        where: { labId, status: LabOrderStatus.IN_PROGRESS },
      }),
      this.prisma.labOrder.count({
        where: { labId, status: LabOrderStatus.RESULT_READY },
      }),
      this.prisma.labOrder.count({
        where: { labId, status: LabOrderStatus.PENDING_VERIFICATION },
      }),
      this.prisma.labOrder.count({
        where: {
          labId,
          status: { in: [LabOrderStatus.VERIFIED, LabOrderStatus.REPORT_DELIVERED] },
          verifiedAt: { gte: startOfDay },
        },
      }),
      this.prisma.labOrder.count({
        where: {
          labId,
          status: LabOrderStatus.REPORT_DELIVERED,
          reportDeliveredAt: { gte: startOfDay },
        },
      }),
      this.prisma.labResultValue.count({
        where: {
          isCritical: true,
          doctorNotified: false,
          orderItem: { order: { labId } },
        },
      }),
      this.prisma.labOrder.count({
        where: { labId, status: LabOrderStatus.SAMPLE_REJECTED },
      }),
      this.prisma.labOrder.count({
        where: { labId, status: LabOrderStatus.RECOLLECTION_REQUESTED },
      }),
      this.prisma.hospitalLabLink.count({
        where: { labId, status: LabLinkStatus.ACTIVE },
      }),
      this.prisma.labOrder.findMany({
        where: {
          labId,
          status: LabOrderStatus.REPORT_DELIVERED,
          reportDeliveredAt: { gte: startOfDay },
        },
        select: { createdAt: true, reportDeliveredAt: true },
      }),
      this.prisma.labOrder.findMany({
        where: { labId, status: { in: NOT_FINALIZED } },
        select: {
          id: true,
          sampleId: true,
          orderNo: true,
          status: true,
          patient: { select: { name: true } },
          items: { select: { testNameSnapshot: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
    ]);

    const averageTurnaroundHours = deliveredForTat.length
      ? Math.round(
          (deliveredForTat.reduce(
            (sum, o) =>
              sum +
              (o.reportDeliveredAt!.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60),
            0,
          ) /
            deliveredForTat.length) *
            10,
        ) / 10
      : null;

    return {
      todaysOrdersCount: todaysOrders.length,
      todaysRevenue: todaysOrders.reduce((sum, o) => sum + Number(o.total), 0),
      samplesPendingCollection,
      samplesReceived,
      processing,
      pendingResults,
      pendingVerification,
      reportsFinalizedToday,
      reportsDeliveredToday,
      criticalUnacknowledged,
      rejectedSamples,
      recollectionRequested,
      activeHospitalLinks,
      averageTurnaroundHours,
      // Back-compat aliases for the existing dashboard widget.
      pendingCollections: samplesPendingCollection,
      pendingWork: pendingWork.map((o) => ({
        id: o.id,
        sampleId: o.sampleId,
        orderNo: o.orderNo,
        patientName: o.patient?.name,
        testNames: o.items.map((i) => i.testNameSnapshot).join(', '),
        status: o.status,
      })),
    };
  }

  async pendingByDepartment(labId: string) {
    const items = await this.prisma.labOrderItem.findMany({
      where: {
        status: { not: 'COMPLETED' },
        order: { labId, status: { in: NOT_FINALIZED } },
      },
      select: { test: { select: { department: true, category: true } } },
    });
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = item.test.department || item.test.category || 'Unassigned';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([department, count]) => ({
      department,
      count,
    }));
  }
}
