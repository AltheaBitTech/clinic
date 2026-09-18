import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PathologyLabsService } from '../pathology-labs/pathology-labs.service';
import { PathologyReportsService } from './pathology-reports.service';

@ApiTags('pathology-reports')
@ApiBearerAuth()
@Controller('pathology-reports')
@Roles(UserRole.PATHOLOGY)
export class PathologyReportsController {
  constructor(
    private readonly reportsService: PathologyReportsService,
    private readonly pathologyLabsService: PathologyLabsService,
  ) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue summary (hospital-linked vs. walk-in)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async revenue(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.reportsService.revenue(lab.id, from, to);
  }

  @Get('tat')
  @ApiOperation({
    summary: 'Average turnaround time (order → report delivered)',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async turnaroundTime(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.reportsService.turnaroundTime(lab.id, from, to);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Referring-doctor commission ledger' })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async commissions(
    @CurrentUser() user: any,
    @Query('doctorId') doctorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.reportsService.commissions(lab.id, doctorId, from, to);
  }
}
