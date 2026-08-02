import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
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
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('page') page?: number,
  ) {
    console.log(`Fetching prescriptions with patientId: ${patientId}, doctorId: ${doctorId}, page: ${page}`);
    return this.prescriptionsService.findAll({ patientId, doctorId }, page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  findOne(@Param('id') id: string) {
    console.log(`Fetching prescription with ID: ${id}`);
    return this.prescriptionsService.findOne(id);
  }
}
