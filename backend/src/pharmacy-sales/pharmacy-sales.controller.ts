import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PharmaciesService } from '../pharmacies/pharmacies.service';
import { CreateCustomerReturnDto, CreateSaleDto } from './dto/sale.dto';
import { PharmacySalesService } from './pharmacy-sales.service';

@ApiTags('pharmacy-sales')
@ApiBearerAuth()
@Controller('pharmacy/sales')
@Roles(UserRole.PHARMACY)
export class PharmacySalesController {
  constructor(
    private readonly salesService: PharmacySalesService,
    private readonly pharmaciesService: PharmaciesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a POS sale' })
  async create(@CurrentUser() user: any, @Body() dto: CreateSaleDto) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.salesService.create(pharmacy.id, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List sales' })
  async findAll(@CurrentUser() user: any) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.salesService.findAll(pharmacy.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sale by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.salesService.findOne(id, pharmacy.id);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Record a customer return against a sale' })
  async createReturn(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CreateCustomerReturnDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.salesService.createReturn(id, pharmacy.id, user.id, dto);
  }
}
