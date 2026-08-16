import { Injectable } from '@nestjs/common';
import { PharmacyPrescriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PharmacyDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(pharmacyId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const expiryCutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [medicines, pendingPrescriptions, todaysSales, expiringBatches] =
      await Promise.all([
        this.prisma.pharmacyMedicine.findMany({
          where: { pharmacyId, isActive: true },
          include: {
            batches: {
              where: { status: 'ACTIVE', expiryDate: { gt: new Date() } },
            },
          },
        }),
        this.prisma.pharmacyPrescription.count({
          where: { pharmacyId, status: PharmacyPrescriptionStatus.PENDING },
        }),
        this.prisma.sale.findMany({
          where: { pharmacyId, createdAt: { gte: startOfDay } },
        }),
        this.prisma.medicineBatch.count({
          where: {
            medicine: { pharmacyId },
            status: 'ACTIVE',
            expiryDate: { lte: expiryCutoff },
          },
        }),
      ]);

    const lowStockCount = medicines.filter((m) => {
      const totalQuantity = m.batches.reduce((sum, b) => sum + b.quantity, 0);
      return totalQuantity <= m.reorderLevel;
    }).length;

    const todaysSalesTotal = todaysSales.reduce(
      (sum, s) => sum + Number(s.total),
      0,
    );

    return {
      lowStockCount,
      expiringSoonCount: expiringBatches,
      pendingPrescriptions,
      todaysSalesCount: todaysSales.length,
      todaysSalesTotal,
    };
  }
}
