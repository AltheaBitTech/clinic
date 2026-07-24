import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('doctors')
@ApiBearerAuth()
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a doctor to the hospital' })
  create(@CurrentUser() user: any, @Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all doctors' })
  findAll(
    @CurrentUser() user: any,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: number,
  ) {
    return this.doctorsService.findAll(user.tenantId, departmentId, page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update doctor profile' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Get(':id/slots')
  @ApiOperation({ summary: 'Get available appointment slots for a doctor' })
  getSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.doctorsService.getAvailableSlots(id, date);
  }
}
