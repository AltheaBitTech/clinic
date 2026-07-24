import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
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
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.svc.createInvoice(user.tenantId, body);
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
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Put('invoices/:id/pay')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Mark invoice as paid' })
  markPaid(@Param('id') id: string) { return this.svc.markAsPaid(id); }
}
