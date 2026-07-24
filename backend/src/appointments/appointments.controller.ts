import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Create appointment' })
  create(@CurrentUser() user: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List appointments with filters' })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'page', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('page') page?: number,
  ) {
    const filters: any = { doctorId, patientId, status, date };
    return this.appointmentsService.findAll(user, filters, page);
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's appointments" })
  getToday(@CurrentUser() user: any) {
    const doctorId = user.role === UserRole.DOCTOR ? user.doctor?.id : undefined;
    return this.appointmentsService.getTodayAppointments(user.tenantId, doctorId);
  }

  @Get('missed-followups')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get missed follow-up appointments' })
  getMissedFollowUps(@CurrentUser() user: any) {
    return this.appointmentsService.getMissedFollowUps(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update appointment status/details' })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }
}
