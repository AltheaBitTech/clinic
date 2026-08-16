import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
import { CreatePharmacyPatientDto } from './dto/pharmacy-patient.dto';
import { PharmacyPatientsService } from './pharmacy-patients.service';

@ApiTags('pharmacy-patients')
@ApiBearerAuth()
@Controller('pharmacy/patients')
@Roles(UserRole.PHARMACY)
export class PharmacyPatientsController {
  constructor(
    private readonly patientsService: PharmacyPatientsService,
    private readonly pharmaciesService: PharmaciesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a pharmacy patient record' })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreatePharmacyPatientDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.patientsService.create(pharmacy.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List/search pharmacy patients' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@CurrentUser() user: any, @Query('search') search?: string) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.patientsService.findAll(pharmacy.id, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a pharmacy patient by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.patientsService.findOne(id, pharmacy.id);
  }
}
