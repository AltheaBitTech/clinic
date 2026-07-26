import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
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
import { CreatePharmacyDto, UpdatePharmacyDto } from './dto/pharmacy.dto';
import { PharmaciesService } from './pharmacies.service';

@ApiTags('pharmacies')
@ApiBearerAuth()
@Controller('pharmacies')
export class PharmaciesController {
  constructor(private readonly pharmaciesService: PharmaciesService) {}

  @Post()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Onboard a new pharmacy' })
  create(@CurrentUser() user: any, @Body() dto: CreatePharmacyDto) {
    return this.pharmaciesService.create(user.tenantId, dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'List all pharmacies for this clinic' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, city, phone, or owner' })
  findAll(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.pharmaciesService.findAll(user.tenantId, search);
  }

  @Get(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get pharmacy details by ID' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pharmaciesService.findOne(id, user.tenantId);
  }

  @Put(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update pharmacy details' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePharmacyDto,
  ) {
    return this.pharmaciesService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Deactivate (soft-delete) a pharmacy — Admin only' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pharmaciesService.remove(id, user.tenantId);
  }
}
