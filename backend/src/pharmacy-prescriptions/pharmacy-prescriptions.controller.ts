import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PharmacyPrescriptionStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PharmaciesService } from '../pharmacies/pharmacies.service';
import {
  CreatePharmacyPrescriptionDto,
  DispensePrescriptionDto,
} from './dto/pharmacy-prescription.dto';
import { PharmacyPrescriptionsService } from './pharmacy-prescriptions.service';

@ApiTags('pharmacy-prescriptions')
@ApiBearerAuth()
@Controller('pharmacy/prescriptions')
@Roles(UserRole.PHARMACY)
export class PharmacyPrescriptionsController {
  constructor(
    private readonly prescriptionsService: PharmacyPrescriptionsService,
    private readonly pharmaciesService: PharmaciesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create/receive a prescription for this pharmacy to fulfil',
  })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreatePharmacyPrescriptionDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.prescriptionsService.create(pharmacy.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Prescription queue, filterable by status' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PharmacyPrescriptionStatus,
  })
  async findAll(
    @CurrentUser() user: any,
    @Query('status') status?: PharmacyPrescriptionStatus,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.prescriptionsService.findAll(pharmacy.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription detail' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.prescriptionsService.findOne(id, pharmacy.id);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify a pending prescription' })
  async verify(@CurrentUser() user: any, @Param('id') id: string) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.prescriptionsService.verify(id, pharmacy.id, user.id);
  }

  @Post(':id/dispense')
  @ApiOperation({
    summary: 'Dispense a verified prescription (full or partial)',
  })
  async dispense(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: DispensePrescriptionDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.prescriptionsService.dispense(id, pharmacy.id, user.id, dto);
  }
}
