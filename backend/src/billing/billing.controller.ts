import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/billing.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private svc: BillingService) {}

  @Post('invoices')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Create invoice' })
  create(@CurrentUser() user: any, @Body() dto: CreateInvoiceDto) {
    return this.svc.createInvoice(user.tenantId, dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
  findAll(
    @CurrentUser() user: any,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Patients may only ever list their own invoices, regardless of what
    // patientId is passed in — prevents one patient from reading another's bills.
    const scopedPatientId =
      user.role === UserRole.PATIENT ? user.patient?.id : patientId;
    return this.svc.findAll(
      user.tenantId,
      scopedPatientId,
      status,
      page,
      limit,
      startDate,
      endDate,
    );
  }

  @Get('invoices/export')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Export invoices as CSV' })
  async exportInvoices(
    @CurrentUser() user: any,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const csv = await this.svc.exportInvoices(
      user.tenantId,
      undefined,
      status,
      startDate,
      endDate,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoices_${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const invoice = await this.svc.findOne(id);
    this.assertAccessible(user, invoice);
    return invoice;
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Download invoice PDF' })
  async downloadPdf(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const invoice = await this.svc.findOne(id);
    this.assertAccessible(user, invoice);
    const { filePath, fileName } = await this.svc.getInvoicePdfFile(id);
    res.download(filePath, fileName);
  }

  private assertAccessible(user: any, invoice: any) {
    if (invoice.tenantId !== user.tenantId) {
      throw new ForbiddenException(
        'You are not authorized to view this invoice',
      );
    }
    if (user.role === UserRole.PATIENT && invoice.patient.userId !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to view this invoice',
      );
    }
  }

  @Put('invoices/:id/pay')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Record an in-person cash/card payment as paid' })
  async markPaid(@CurrentUser() user: any, @Param('id') id: string) {
    const invoice = await this.svc.findOne(id);
    this.assertAccessible(user, invoice);
    return this.svc.markAsPaid(id);
  }

  @Post('invoices/:id/create-payment-order')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Create a Razorpay order to pay an invoice online' })
  async createPaymentOrder(@CurrentUser() user: any, @Param('id') id: string) {
    const invoice = await this.svc.findOne(id);
    this.assertAccessible(user, invoice);
    return this.svc.createPaymentOrder(id);
  }

  @Post('invoices/:id/verify-payment')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Verify a completed Razorpay payment and mark the invoice as paid',
  })
  async verifyPayment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    const invoice = await this.svc.findOne(id);
    this.assertAccessible(user, invoice);
    return this.svc.verifyPayment(id, dto);
  }
}
