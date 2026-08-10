import { Controller, Get, Post, Body, Param, Query, Res, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/prescription.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import * as path from 'path';

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Create prescription with medicines and auto-schedule reminders' })
  create(@Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List prescriptions' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'page', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('page') page?: number,
  ) {
    let effectivePatientId = patientId;

    if (user.role === UserRole.PATIENT) {
      const ownPatientId = await this.prescriptionsService.getPatientIdForUser(user.id);
      if (!ownPatientId) return { data: [], total: 0, page: page || 1, limit: 20 };
      effectivePatientId = ownPatientId;
    }

    return this.prescriptionsService.findAll(
      { patientId: effectivePatientId, doctorId, tenantId: user.tenantId },
      page,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const prescription = await this.prescriptionsService.findOne(id, user.tenantId);
    if (user.role === UserRole.PATIENT && prescription.patient.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to view this prescription');
    }
    return prescription;
  }
}
