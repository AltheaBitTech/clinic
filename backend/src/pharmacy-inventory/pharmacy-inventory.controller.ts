import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
import {
  CreateBatchDto,
  CreateStockAdjustmentDto,
} from './dto/stock-adjustment.dto';
import { PharmacyInventoryService } from './pharmacy-inventory.service';

@ApiTags('pharmacy-inventory')
@ApiBearerAuth()
@Controller('pharmacy/inventory')
@Roles(UserRole.PHARMACY)
export class PharmacyInventoryController {
  constructor(
    private readonly inventoryService: PharmacyInventoryService,
    private readonly pharmaciesService: PharmaciesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all batches with derived expiry status' })
  async list(@CurrentUser() user: any) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.inventoryService.listBatches(pharmacy.id);
  }

  @Get('expiry')
  @ApiOperation({ summary: 'List expired / soon-to-expire batches' })
  @ApiQuery({ name: 'withinDays', required: false, type: Number })
  async expiry(
    @CurrentUser() user: any,
    @Query('withinDays') withinDays?: string,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.inventoryService.listExpiry(
      pharmacy.id,
      withinDays ? Number(withinDays) : undefined,
    );
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'List medicines at or below reorder level' })
  async lowStock(@CurrentUser() user: any) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.inventoryService.listLowStock(pharmacy.id);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Stock ledger / movement history' })
  @ApiQuery({ name: 'medicineId', required: false })
  @ApiQuery({ name: 'batchId', required: false })
  async movements(
    @CurrentUser() user: any,
    @Query('medicineId') medicineId?: string,
    @Query('batchId') batchId?: string,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.inventoryService.listMovements(
      pharmacy.id,
      medicineId,
      batchId,
    );
  }

  @Post('adjustments')
  @ApiOperation({ summary: 'Manually adjust batch stock (reason required)' })
  async adjust(
    @CurrentUser() user: any,
    @Body() dto: CreateStockAdjustmentDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.inventoryService.createAdjustment(pharmacy.id, user.id, dto);
  }

  @Post('batches')
  @ApiOperation({
    summary: 'Manually create a new batch with opening stock (reason required)',
  })
  async createBatch(@CurrentUser() user: any, @Body() dto: CreateBatchDto) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.inventoryService.createBatch(pharmacy.id, user.id, dto);
  }
}
