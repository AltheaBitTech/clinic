import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, AddFamilyMemberDto } from './dto/patient.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Register a new patient' })
  create(@CurrentUser() user: any, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(user.tenantId, dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'List all patients for this hospital' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.patientsService.findAll(user.tenantId, search, page, limit);
  }

  @Get('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get own patient profile' })
  async getMyProfile(@CurrentUser() user: any) {
    const patient = await this.patientsService['prisma'].patient.findFirst({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
        familyMembers: true,
      },
    });
    return patient;
  }

  @Get(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get patient by ID' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.patientsService.findOne(id, user.tenantId);
  }

  @Put(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Update patient info' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, user.tenantId, dto);
  }

  @Post(':id/family-members')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Add a family member to patient' })
  addFamilyMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AddFamilyMemberDto,
  ) {
    return this.patientsService.addFamilyMember(id, user.tenantId, dto);
  }

  @Get(':id/timeline')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get patient timeline events' })
  getTimeline(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.patientsService.getTimeline(id, user.tenantId, page, limit);
  }
}
