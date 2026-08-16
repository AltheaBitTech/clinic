import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
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
  @ApiOperation({ summary: 'Sales report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async sales(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.reportsService.salesReport(pharmacy.id, from, to);
  }

  @Get('purchases')
  @ApiOperation({ summary: 'Purchases report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async purchases(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.reportsService.purchasesReport(pharmacy.id, from, to);
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
