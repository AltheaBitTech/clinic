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
import {
  CreatePharmacyMedicineDto,
  UpdatePharmacyMedicineDto,
} from './dto/pharmacy-medicine.dto';
import { PharmacyCatalogService } from './pharmacy-catalog.service';

@ApiTags('pharmacy-medicines')
@ApiBearerAuth()
@Controller('pharmacy/medicines')
@Roles(UserRole.PHARMACY)
export class PharmacyCatalogController {
  constructor(
    private readonly catalogService: PharmacyCatalogService,
    private readonly pharmaciesService: PharmaciesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a medicine in this pharmacy’s catalog' })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreatePharmacyMedicineDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.catalogService.create(pharmacy.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List/search medicines in this pharmacy’s catalog' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@CurrentUser() user: any, @Query('search') search?: string) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.catalogService.findAll(pharmacy.id, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a medicine by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.catalogService.findOne(id, pharmacy.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a medicine (or soft-deactivate via isActive)',
  })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePharmacyMedicineDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.catalogService.update(id, pharmacy.id, dto);
  }
}
