import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ReportsService } from './reports.service';
import { UploadReportDto } from './dto/report.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportType, UserRole } from '@prisma/client';

const storage = memoryStorage();

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a patient report' })
  async upload(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadReportDto,
  ) {
    let patientId = dto.patientId;

    if (user.role === UserRole.PATIENT) {
      // Patients always upload against their own record — resolve it from
      // the JWT user server-side rather than trusting (or requiring) a
      // client-supplied patientId.
      const ownPatientId = await this.reportsService.getPatientIdForUser(
        user.id,
      );
      if (!ownPatientId) {
        throw new BadRequestException(
          'Your patient profile has not been configured yet.',
        );
      }
      patientId = ownPatientId;
    } else if (!patientId) {
      throw new BadRequestException('patientId is required');
    }

    return this.reportsService.create(
      user.tenantId,
      user.id,
      patientId,
      file,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List reports' })
  async findAll(
    @CurrentUser() user: any,
    @Query('patientId') patientId?: string,
    @Query('type') type?: ReportType,
    @Query('page') page?: number,
    @Query('search') search?: string,
  ) {
    let effectivePatientId = patientId;

    if (user.role === UserRole.PATIENT) {
      const ownPatientId = await this.reportsService.getPatientIdForUser(
        user.id,
      );
      if (!ownPatientId)
        return { data: [], total: 0, page: page || 1, limit: 20 };
      effectivePatientId = ownPatientId;
    }

    return this.reportsService.findAll(
      user.tenantId,
      effectivePatientId,
      type,
      page,
      20,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient report by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const report = await this.reportsService.findOne(id);
    if (user.role === UserRole.PATIENT && report.patient.userId !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to view this report',
      );
    }
    return report;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a patient report' })
  delete(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}
