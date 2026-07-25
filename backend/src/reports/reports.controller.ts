import { Controller, Get, Post, Delete, Body, Param, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ReportsService } from './reports.service';
import { UploadReportDto } from './dto/report.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportType } from '@prisma/client';

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
    return this.reportsService.create(user.tenantId, user.id, dto.patientId, file, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List reports' })
  findAll(
    @CurrentUser() user: any,
    @Query('patientId') patientId?: string,
    @Query('type') type?: ReportType,
    @Query('page') page?: number,
  ) {
    return this.reportsService.findAll(user.tenantId, patientId, type, page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient report by ID' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a patient report' })
  delete(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}
