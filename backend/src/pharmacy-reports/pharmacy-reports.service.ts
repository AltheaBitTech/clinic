import { Injectable } from '@nestjs/common';
import { PaymentStatus, PurchaseOrderStatus, ReturnType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildCsv, buildTablePdf } from './report-export.util';

const money = (v: number) =>
  `Rs. ${Number(v).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export interface SalesReportFilters {
  from?: string;
  to?: string;
  paymentStatus?: PaymentStatus;
}

export interface PurchasesReportFilters {
  from?: string;
  to?: string;
  supplierId?: string;
  orderNo?: string;
  invoiceNo?: string;
  status?: PurchaseOrderStatus;
}

@Injectable()
export class PharmacyReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private dateRange(from?: string, to?: string) {
    return {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
    };
  }

  private startOfDay(d = new Date()) {
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    return s;
  }

  // ───────────────────────────── SALES ─────────────────────────────

  async salesReport(pharmacyId: string, filters: SalesReportFilters) {
    const { from, to, paymentStatus } = filters;
    const sales = await this.prisma.sale.findMany({
      where: {
        pharmacyId,
        ...(from || to ? { createdAt: this.dateRange(from, to) } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
      include: { items: true, payments: true, returns: true, patient: true },
      orderBy: { createdAt: 'desc' },
    });

    const todaysSales = await this.prisma.sale.findMany({
      where: { pharmacyId, createdAt: { gte: this.startOfDay() } },
      include: { payments: true },
    });

    const rows = sales.map((s) => {
      const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const outstanding = Math.max(Number(s.total) - paid, 0);
      const refunded = s.returns.reduce((sum, r) => sum + Number(r.total), 0);
      return { ...s, paid, outstanding, refunded };
    });

    const revenue = rows.reduce((sum, r) => sum + Number(r.total), 0);
    const discount = rows.reduce((sum, r) => sum + Number(r.discount), 0);
    const tax = rows.reduce((sum, r) => sum + Number(r.tax), 0);
    const paymentsCollected = rows.reduce((sum, r) => sum + r.paid, 0);
    const outstanding = rows.reduce((sum, r) => sum + r.outstanding, 0);

    const cancelledRows = rows.filter(
      (r) => r.paymentStatus === PaymentStatus.CANCELLED,
    );
    const refundRows = rows.filter((r) => r.refunded > 0);

    const groupBy = (keyFn: (d: Date) => string) => {
      const map = new Map<string, { count: number; revenue: number }>();
      for (const r of rows) {
        const key = keyFn(r.createdAt);
        const bucket = map.get(key) ?? { count: 0, revenue: 0 };
        bucket.count += 1;
        bucket.revenue += Number(r.total);
        map.set(key, bucket);
      }
      return [...map.entries()]
        .map(([key, v]) => ({ key, ...v }))
        .sort((a, b) => (a.key < b.key ? 1 : -1));
    };

    const yearWise = groupBy((d) => String(d.getFullYear())).map((r) => ({
      year: r.key,
      count: r.count,
      revenue: r.revenue,
    }));
    const monthWise = groupBy(
      (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    ).map((r) => ({ month: r.key, count: r.count, revenue: r.revenue }));
    const dateWise = groupBy((d) => d.toISOString().slice(0, 10)).map((r) => ({
      date: r.key,
      count: r.count,
      revenue: r.revenue,
    }));

    return {
      filters,
      totals: {
        count: rows.length,
        revenue,
        discount,
        tax,
        paymentsCollected,
        outstanding,
      },
      today: {
        count: todaysSales.length,
        revenue: todaysSales.reduce((sum, s) => sum + Number(s.total), 0),
      },
      cancelled: {
        count: cancelledRows.length,
        amount: cancelledRows.reduce((sum, r) => sum + Number(r.total), 0),
      },
      refunds: {
        count: refundRows.length,
        amount: refundRows.reduce((sum, r) => sum + r.refunded, 0),
      },
      yearWise,
      monthWise,
      dateWise,
      sales: rows,
    };
  }

  private salesCsvRows(rows: any[]) {
    const headers = [
      'Invoice No',
      'Date',
      'Patient',
      'Subtotal',
      'Discount',
      'Tax',
      'Total',
      'Paid',
      'Outstanding',
      'Refunded',
      'Status',
    ];
    const data = rows.map((s) => [
      s.invoiceNo,
      new Date(s.createdAt).toLocaleString('en-IN'),
      s.patient?.name ?? '-',
      Number(s.subtotal).toFixed(2),
      Number(s.discount).toFixed(2),
      Number(s.tax).toFixed(2),
      Number(s.total).toFixed(2),
      s.paid.toFixed(2),
      s.outstanding.toFixed(2),
      s.refunded.toFixed(2),
      s.paymentStatus,
    ]);
    return { headers, data };
  }

  async salesExportCsv(pharmacyId: string, filters: SalesReportFilters) {
    const report = await this.salesReport(pharmacyId, filters);
    const { headers, data } = this.salesCsvRows(report.sales);
    return buildCsv(headers, data);
  }

  async salesExportPdf(pharmacyId: string, filters: SalesReportFilters) {
    const report = await this.salesReport(pharmacyId, filters);
    const { headers, data } = this.salesCsvRows(report.sales);
    return buildTablePdf(
      'Sales Report',
      `${filters.from ?? 'All time'} to ${filters.to ?? 'now'}`,
      headers,
      data,
      [
        { label: 'Total sales', value: String(report.totals.count) },
        { label: 'Revenue', value: money(report.totals.revenue) },
        { label: 'Collected', value: money(report.totals.paymentsCollected) },
        { label: 'Outstanding', value: money(report.totals.outstanding) },
      ],
    );
  }

  // ─────────────────────────── PURCHASES ───────────────────────────

  async purchasesReport(pharmacyId: string, filters: PurchasesReportFilters) {
    const { from, to, supplierId, orderNo, invoiceNo, status } = filters;
    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        pharmacyId,
        ...(from || to ? { createdAt: this.dateRange(from, to) } : {}),
        ...(supplierId ? { supplierId } : {}),
        ...(orderNo
          ? { orderNo: { contains: orderNo, mode: 'insensitive' } }
          : {}),
        ...(invoiceNo
          ? { invoiceNo: { contains: invoiceNo, mode: 'insensitive' } }
          : {}),
        ...(status ? { status } : {}),
      },
      include: { items: true, supplier: true },
      orderBy: { createdAt: 'desc' },
    });

    const todaysOrders = await this.prisma.purchaseOrder.findMany({
      where: { pharmacyId, createdAt: { gte: this.startOfDay() } },
    });

    const returns = await this.prisma.return.findMany({
      where: {
        pharmacyId,
        type: ReturnType.SUPPLIER,
        ...(from || to ? { createdAt: this.dateRange(from, to) } : {}),
      },
    });

    const amount = (o: (typeof orders)[number]) => Number(o.total);
    const totalPurchases = orders.reduce((sum, o) => sum + amount(o), 0);
    const receivedStockValue = orders.reduce(
      (sum, o) =>
        sum +
        o.items.reduce((s, i) => s + i.receivedQuantity * Number(i.rate), 0),
      0,
    );

    const pendingStatuses: PurchaseOrderStatus[] = [
      PurchaseOrderStatus.DRAFT,
      PurchaseOrderStatus.ORDERED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ];
    const pendingOrders = orders.filter((o) =>
      pendingStatuses.includes(o.status),
    );
    const cancelledOrders = orders.filter(
      (o) => o.status === PurchaseOrderStatus.CANCELLED,
    );

    const groupBy = (keyFn: (d: Date) => string) => {
      const map = new Map<string, { count: number; amount: number }>();
      for (const o of orders) {
        const key = keyFn(o.createdAt);
        const bucket = map.get(key) ?? { count: 0, amount: 0 };
        bucket.count += 1;
        bucket.amount += amount(o);
        map.set(key, bucket);
      }
      return [...map.entries()]
        .map(([key, v]) => ({ key, ...v }))
        .sort((a, b) => (a.key < b.key ? 1 : -1));
    };

    const monthWise = groupBy(
      (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    ).map((r) => ({ month: r.key, count: r.count, amount: r.amount }));
    const dateWise = groupBy((d) => d.toISOString().slice(0, 10)).map((r) => ({
      date: r.key,
      count: r.count,
      amount: r.amount,
    }));

    const supplierMap = new Map<
      string,
      {
        supplierId: string;
        supplierName: string;
        count: number;
        amount: number;
      }
    >();
    for (const o of orders) {
      const bucket = supplierMap.get(o.supplierId) ?? {
        supplierId: o.supplierId,
        supplierName: o.supplier.name,
        count: 0,
        amount: 0,
      };
      bucket.count += 1;
      bucket.amount += amount(o);
      supplierMap.set(o.supplierId, bucket);
    }
    const supplierWise = [...supplierMap.values()].sort(
      (a, b) => b.amount - a.amount,
    );

    return {
      filters,
      totals: { count: orders.length, amount: totalPurchases },
      today: {
        count: todaysOrders.length,
        amount: todaysOrders.reduce((sum, o) => sum + Number(o.total), 0),
      },
      pending: {
        count: pendingOrders.length,
        amount: pendingOrders.reduce((sum, o) => sum + amount(o), 0),
      },
      cancelled: {
        count: cancelledOrders.length,
        amount: cancelledOrders.reduce((sum, o) => sum + amount(o), 0),
      },
      returns: {
        count: returns.length,
        amount: returns.reduce((sum, r) => sum + Number(r.total), 0),
      },
      receivedStockValue,
      monthWise,
      dateWise,
      supplierWise,
      orders,
    };
  }

  private purchasesCsvRows(orders: any[]) {
    const headers = [
      'Order No',
      'Date',
      'Supplier',
      'Invoice No',
      'Status',
      'Subtotal',
      'Discount',
      'Tax',
      'Total',
    ];
    const data = orders.map((o) => [
      o.orderNo,
      new Date(o.createdAt).toLocaleString('en-IN'),
      o.supplier?.name ?? '-',
      o.invoiceNo ?? '-',
      o.status,
      Number(o.subtotal).toFixed(2),
      Number(o.discount).toFixed(2),
      Number(o.tax).toFixed(2),
      Number(o.total).toFixed(2),
    ]);
    return { headers, data };
  }

  async purchasesExportCsv(
    pharmacyId: string,
    filters: PurchasesReportFilters,
  ) {
    const report = await this.purchasesReport(pharmacyId, filters);
    const { headers, data } = this.purchasesCsvRows(report.orders);
    return buildCsv(headers, data);
  }

  async purchasesExportPdf(
    pharmacyId: string,
    filters: PurchasesReportFilters,
  ) {
    const report = await this.purchasesReport(pharmacyId, filters);
    const { headers, data } = this.purchasesCsvRows(report.orders);
    return buildTablePdf(
      'Purchase Report',
      `${filters.from ?? 'All time'} to ${filters.to ?? 'now'}`,
      headers,
      data,
      [
        { label: 'Total orders', value: String(report.totals.count) },
        { label: 'Total purchases', value: money(report.totals.amount) },
        { label: 'Pending', value: money(report.pending.amount) },
        {
          label: 'Received stock value',
          value: money(report.receivedStockValue),
        },
      ],
    );
  }

  // ───────────────────────── SUPPLIER HISTORY ─────────────────────────

  async supplierHistorySummary(pharmacyId: string) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { pharmacyId },
      include: { supplier: true },
    });
    const map = new Map<
      string,
      {
        supplierId: string;
        supplierName: string;
        orderCount: number;
        totalAmount: number;
        lastOrderAt: Date;
      }
    >();
    for (const o of orders) {
      const bucket = map.get(o.supplierId) ?? {
        supplierId: o.supplierId,
        supplierName: o.supplier.name,
        orderCount: 0,
        totalAmount: 0,
        lastOrderAt: o.createdAt,
      };
      bucket.orderCount += 1;
      bucket.totalAmount += Number(o.total);
      if (o.createdAt > bucket.lastOrderAt) bucket.lastOrderAt = o.createdAt;
      map.set(o.supplierId, bucket);
    }
    return [...map.values()].sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async supplierHistory(pharmacyId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, pharmacyId },
    });

    const orders = await this.prisma.purchaseOrder.findMany({
      where: { pharmacyId, supplierId },
      include: { items: { include: { medicine: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const medicineIds = [
      ...new Set(orders.flatMap((o) => o.items.map((i) => i.medicineId))),
    ];
    const batches = medicineIds.length
      ? await this.prisma.medicineBatch.findMany({
          where: { medicineId: { in: medicineIds } },
        })
      : [];
    const batchByKey = new Map(
      batches.map((b) => [`${b.medicineId}:${b.batchNo}`, b]),
    );

    const products = orders.flatMap((o) =>
      o.items.map((i) => {
        const batch = batchByKey.get(`${i.medicineId}:${i.batchNo}`);
        return {
          medicineName: i.medicine.name,
          batchNo: i.batchNo,
          quantity: i.quantity,
          receivedQuantity: i.receivedQuantity,
          purchasePrice: Number(i.rate),
          mrp: i.mrp != null ? Number(i.mrp) : null,
          salePrice: batch ? Number(batch.salePrice) : null,
          purchaseDate: o.orderDate ?? o.createdAt,
          expiryDate: i.expiryDate,
          invoiceNo: o.invoiceNo,
          orderNo: o.orderNo,
        };
      }),
    );

    return {
      supplier,
      totals: {
        totalOrders: orders.length,
        totalPurchaseAmount: orders.reduce(
          (sum, o) => sum + Number(o.total),
          0,
        ),
        totalItems: products.length,
      },
      products,
    };
  }

  private supplierHistoryCsvRows(products: any[]) {
    const headers = [
      'Medicine',
      'Batch No',
      'Quantity',
      'Purchase Price',
      'MRP',
      'Sale Price',
      'Purchase Date',
      'Expiry Date',
      'Invoice No',
      'Order No',
    ];
    const data = products.map((p) => [
      p.medicineName,
      p.batchNo,
      p.quantity,
      p.purchasePrice.toFixed(2),
      p.mrp != null ? p.mrp.toFixed(2) : '-',
      p.salePrice != null ? p.salePrice.toFixed(2) : '-',
      new Date(p.purchaseDate).toLocaleDateString('en-IN'),
      new Date(p.expiryDate).toLocaleDateString('en-IN'),
      p.invoiceNo ?? '-',
      p.orderNo,
    ]);
    return { headers, data };
  }

  async supplierHistoryExportCsv(pharmacyId: string, supplierId: string) {
    const history = await this.supplierHistory(pharmacyId, supplierId);
    const { headers, data } = this.supplierHistoryCsvRows(history.products);
    return buildCsv(headers, data);
  }

  async supplierHistoryExportPdf(pharmacyId: string, supplierId: string) {
    const history = await this.supplierHistory(pharmacyId, supplierId);
    const { headers, data } = this.supplierHistoryCsvRows(history.products);
    return buildTablePdf(
      `Purchase History — ${history.supplier?.name ?? 'Supplier'}`,
      `${history.totals.totalOrders} orders`,
      headers,
      data,
      [
        { label: 'Total orders', value: String(history.totals.totalOrders) },
        {
          label: 'Total amount',
          value: money(history.totals.totalPurchaseAmount),
        },
      ],
    );
  }

  // ─────────────────────────── INVENTORY / EXPIRY ───────────────────────────

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
