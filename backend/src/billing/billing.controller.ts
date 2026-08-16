import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/billing.dto';
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
  ) {
    return this.svc.findAll(user.tenantId, patientId, status, page);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Download invoice PDF' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const { filePath, fileName } = await this.svc.getInvoicePdfFile(id);
    res.download(filePath, fileName);
  }

  @Put('invoices/:id/pay')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Mark invoice as paid' })
  markPaid(@Param('id') id: string) {
    return this.svc.markAsPaid(id);
  }
}
