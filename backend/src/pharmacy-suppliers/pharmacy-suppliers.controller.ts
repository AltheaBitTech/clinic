import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { PharmacySuppliersService } from './pharmacy-suppliers.service';

@ApiTags('pharmacy-suppliers')
@ApiBearerAuth()
@Controller('pharmacy/suppliers')
@Roles(UserRole.PHARMACY)
export class PharmacySuppliersController {
  constructor(
    private readonly suppliersService: PharmacySuppliersService,
    private readonly pharmaciesService: PharmaciesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a supplier' })
  async create(@CurrentUser() user: any, @Body() dto: CreateSupplierDto) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.suppliersService.create(pharmacy.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List suppliers' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.suppliersService.findAll(
      pharmacy.id,
      search,
      includeInactive === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.suppliersService.findOne(id, pharmacy.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a supplier (or deactivate/reactivate via isActive)',
  })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.suppliersService.update(id, pharmacy.id, dto);
  }
}
