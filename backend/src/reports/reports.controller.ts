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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ReportsService } from './reports.service';
import { UploadReportDto } from './dto/report.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportType, UserRole } from '@prisma/client';

const storage = diskStorage({
  destination: './uploads/reports',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a patient report' })
  upload(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadReportDto,
  ) {
    return this.reportsService.create(
      user.tenantId,
      user.id,
      dto.patientId,
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
