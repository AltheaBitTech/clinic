import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  HospitalReportsService,
  ReportFilters,
} from './hospital-reports.service';

const EXPORT_ROW_CAP = 5000;

@ApiTags('hospital-reports')
@ApiBearerAuth()
@Controller('hospital-reports')
@Roles(UserRole.HOSPITAL_ADMIN)
export class HospitalReportsController {
  constructor(private readonly reportsService: HospitalReportsService) {}

  @Get(':type')
  @ApiOperation({ summary: 'Run a hospital analytics report' })
  @ApiQuery({ name: 'preset', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async run(
    @CurrentUser() user: any,
    @Param('type') type: string,
    @Query('preset') preset?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('doctorId') doctorId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!this.reportsService.isValidType(type)) {
      throw new BadRequestException(`Unknown report type: ${type}`);
    }
    const filters: ReportFilters = {
      preset,
      from,
      to,
      doctorId,
      departmentId,
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    const result = await this.reportsService.getReport(
      user.tenantId,
      type,
      filters,
    );
    return { label: this.reportsService.labelFor(type), ...result };
  }

  @Get(':type/export')
  @ApiOperation({ summary: 'Export a hospital analytics report as CSV' })
  @Header('Content-Type', 'text/csv')
  async export(
    @CurrentUser() user: any,
    @Param('type') type: string,
    @Res() res: Response,
    @Query('preset') preset?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('doctorId') doctorId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    if (!this.reportsService.isValidType(type)) {
      throw new BadRequestException(`Unknown report type: ${type}`);
    }
    const filters: ReportFilters = {
      preset,
      from,
      to,
      doctorId,
      departmentId,
      status,
      search,
      page: 1,
      limit: EXPORT_ROW_CAP,
    };
    const result = await this.reportsService.getReport(
      user.tenantId,
      type,
      filters,
    );
    const csv = this.reportsService.toCsv(result);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-report.csv"`,
    );
    res.send(csv);
  }
}
