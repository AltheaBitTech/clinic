import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/prescription.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Create prescription with medicines and auto-schedule reminders',
  })
  create(@CurrentUser() user: any, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List prescriptions' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'page', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('search') search?: string,
    @Query('date') date?: string,
    @Query('page') page?: number,
  ) {
    let effectivePatientId = patientId;

    if (user.role === UserRole.PATIENT) {
      const ownPatientId = await this.prescriptionsService.getPatientIdForUser(
        user.id,
      );
      if (!ownPatientId)
        return { data: [], total: 0, page: page || 1, limit: 20 };
      effectivePatientId = ownPatientId;
    }

    return this.prescriptionsService.findAll(
      {
        patientId: effectivePatientId,
        doctorId,
        search,
        date,
        tenantId: user.tenantId,
      },
      page,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const prescription = await this.prescriptionsService.findOne(
      id,
      user.tenantId,
    );
    if (
      user.role === UserRole.PATIENT &&
      prescription.patient.userId !== user.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to view this prescription',
      );
    }
    return prescription;
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download prescription PDF' })
  async downloadPdf(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const prescription = await this.prescriptionsService.findOne(
      id,
      user.tenantId,
    );
    if (
      user.role === UserRole.PATIENT &&
      prescription.patient.userId !== user.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to view this prescription',
      );
    }
    const { buffer, fileName } =
      await this.prescriptionsService.getPdfFile(prescription);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Get(':id/pharmacy-status')
  @ApiOperation({
    summary: 'Get pharmacy fulfillment status for a routed prescription',
  })
  async getPharmacyStatus(@CurrentUser() user: any, @Param('id') id: string) {
    const prescription = await this.prescriptionsService.findOne(
      id,
      user.tenantId,
    );
    if (
      user.role === UserRole.PATIENT &&
      prescription.patient.userId !== user.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to view this prescription',
      );
    }
    return this.prescriptionsService.getPharmacyStatus(
      id,
      prescription.pharmacyId,
    );
  }
}
