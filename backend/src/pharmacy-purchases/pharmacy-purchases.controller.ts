import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PharmaciesService } from '../pharmacies/pharmacies.service';
import {
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
} from './dto/purchase-order.dto';
import { PharmacyPurchasesService } from './pharmacy-purchases.service';

@ApiTags('pharmacy-purchases')
@ApiBearerAuth()
@Controller('pharmacy/purchases')
@Roles(UserRole.PHARMACY)
export class PharmacyPurchasesController {
  constructor(
    private readonly purchasesService: PharmacyPurchasesService,
    private readonly pharmaciesService: PharmaciesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a purchase order' })
  async create(@CurrentUser() user: any, @Body() dto: CreatePurchaseOrderDto) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.purchasesService.create(pharmacy.id, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  async findAll(@CurrentUser() user: any) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.purchasesService.findAll(pharmacy.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.purchasesService.findOne(id, pharmacy.id);
  }

  @Post(':id/receive')
  @ApiOperation({
    summary: 'Receive stock against a purchase order (full or partial)',
  })
  async receive(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.purchasesService.receive(id, pharmacy.id, user.id, dto);
  }
}
