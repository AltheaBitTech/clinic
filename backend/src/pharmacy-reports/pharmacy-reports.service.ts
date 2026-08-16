import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PharmacyReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private dateRange(from?: string, to?: string) {
    return {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  async salesReport(pharmacyId: string, from?: string, to?: string) {
    const sales = await this.prisma.sale.findMany({
      where: {
        pharmacyId,
        ...(from || to ? { createdAt: this.dateRange(from, to) } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalTax = sales.reduce((sum, s) => sum + Number(s.tax), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discount), 0);
    return { count: sales.length, totalSales, totalTax, totalDiscount, sales };
  }

  async purchasesReport(pharmacyId: string, from?: string, to?: string) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        pharmacyId,
        ...(from || to ? { createdAt: this.dateRange(from, to) } : {}),
      },
      include: { items: true, supplier: true },
      orderBy: { createdAt: 'desc' },
    });
    const totalPurchases = orders.reduce((sum, o) => sum + Number(o.total), 0);
    return { count: orders.length, totalPurchases, orders };
  }

  async inventoryReport(pharmacyId: string) {
    const medicines = await this.prisma.pharmacyMedicine.findMany({
      where: { pharmacyId, isActive: true },
      include: { batches: true },
    });
    const rows = medicines.map((m) => {
      const totalQuantity = m.batches.reduce((sum, b) => sum + b.quantity, 0);
      const stockValue = m.batches.reduce(
        (sum, b) => sum + b.quantity * Number(b.purchasePrice),
        0,
      );
      return { medicine: m, totalQuantity, stockValue };
    });
    const totalStockValue = rows.reduce((sum, r) => sum + r.stockValue, 0);
    return { count: rows.length, totalStockValue, rows };
  }

  async expiryReport(pharmacyId: string, withinDays = 90) {
    const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    const batches = await this.prisma.medicineBatch.findMany({
      where: { medicine: { pharmacyId }, expiryDate: { lte: cutoff } },
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
    });
    const now = Date.now();
    const rows = batches.map((b) => ({
      ...b,
      isExpired: b.expiryDate.getTime() < now,
      daysToExpiry: Math.ceil(
        (b.expiryDate.getTime() - now) / (1000 * 60 * 60 * 24),
      ),
    }));
    return { count: rows.length, rows };
  }
}
