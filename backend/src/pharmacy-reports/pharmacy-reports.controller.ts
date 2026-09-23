import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentStatus, PurchaseOrderStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PharmaciesService } from '../pharmacies/pharmacies.service';
import { PharmacyReportsService } from './pharmacy-reports.service';

@ApiTags('pharmacy-reports')
@ApiBearerAuth()
@Controller('pharmacy/reports')
@Roles(UserRole.PHARMACY)
export class PharmacyReportsController {
  constructor(
    private readonly reportsService: PharmacyReportsService,
    private readonly pharmaciesService: PharmaciesService,
  ) {}

  @Get('sales')
  @ApiOperation({ summary: 'Sales report with period breakdowns' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus })
  async sales(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.reportsService.salesReport(pharmacy.id, {
      from,
      to,
      paymentStatus,
    });
  }

  @Get('sales/export')
  @ApiOperation({ summary: 'Export the sales report as CSV or PDF' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'pdf'] })
  async exportSales(
    @CurrentUser() user: any,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    const filters = { from, to, paymentStatus };
    if (format === 'pdf') {
      const buffer = await this.reportsService.salesExportPdf(
        pharmacy.id,
        filters,
      );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="sales-report.pdf"',
      });
      return res.send(buffer);
    }
    const csv = await this.reportsService.salesExportCsv(pharmacy.id, filters);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="sales-report.csv"',
    });
    res.send(csv);
  }

  @Get('purchases')
  @ApiOperation({ summary: 'Purchase/procurement report with breakdowns' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'orderNo', required: false })
  @ApiQuery({ name: 'invoiceNo', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseOrderStatus })
  async purchases(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('supplierId') supplierId?: string,
    @Query('orderNo') orderNo?: string,
    @Query('invoiceNo') invoiceNo?: string,
    @Query('status') status?: PurchaseOrderStatus,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.reportsService.purchasesReport(pharmacy.id, {
      from,
      to,
      supplierId,
      orderNo,
      invoiceNo,
      status,
    });
  }

  @Get('purchases/export')
  @ApiOperation({ summary: 'Export the purchase report as CSV or PDF' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'orderNo', required: false })
  @ApiQuery({ name: 'invoiceNo', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseOrderStatus })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'pdf'] })
  async exportPurchases(
    @CurrentUser() user: any,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('supplierId') supplierId?: string,
    @Query('orderNo') orderNo?: string,
    @Query('invoiceNo') invoiceNo?: string,
    @Query('status') status?: PurchaseOrderStatus,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    const filters = { from, to, supplierId, orderNo, invoiceNo, status };
    if (format === 'pdf') {
      const buffer = await this.reportsService.purchasesExportPdf(
        pharmacy.id,
        filters,
      );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="purchase-report.pdf"',
      });
      return res.send(buffer);
    }
    const csv = await this.reportsService.purchasesExportCsv(
      pharmacy.id,
      filters,
    );
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="purchase-report.csv"',
    });
    res.send(csv);
  }

  @Get('suppliers-history')
  @ApiOperation({ summary: 'Per-supplier purchasing summary' })
  async supplierHistorySummary(@CurrentUser() user: any) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.reportsService.supplierHistorySummary(pharmacy.id);
  }

  @Get('suppliers/:supplierId/history')
  @ApiOperation({
    summary: 'Full product-level purchase history for one supplier',
  })
  async supplierHistory(
    @CurrentUser() user: any,
    @Param('supplierId') supplierId: string,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.reportsService.supplierHistory(pharmacy.id, supplierId);
  }

  @Get('suppliers/:supplierId/history/export')
  @ApiOperation({ summary: "Export one supplier's purchase history" })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'pdf'] })
  async exportSupplierHistory(
    @CurrentUser() user: any,
    @Param('supplierId') supplierId: string,
    @Res() res: Response,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    if (format === 'pdf') {
      const buffer = await this.reportsService.supplierHistoryExportPdf(
        pharmacy.id,
        supplierId,
      );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="supplier-history.pdf"',
      });
      return res.send(buffer);
    }
    const csv = await this.reportsService.supplierHistoryExportCsv(
      pharmacy.id,
      supplierId,
    );
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="supplier-history.csv"',
    });
    res.send(csv);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory valuation report' })
  async inventory(@CurrentUser() user: any) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.reportsService.inventoryReport(pharmacy.id);
  }

  @Get('expiry')
  @ApiOperation({ summary: 'Expiry report' })
  @ApiQuery({ name: 'withinDays', required: false, type: Number })
  async expiry(
    @CurrentUser() user: any,
    @Query('withinDays') withinDays?: string,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.reportsService.expiryReport(
      pharmacy.id,
      withinDays ? Number(withinDays) : undefined,
    );
  }
}
