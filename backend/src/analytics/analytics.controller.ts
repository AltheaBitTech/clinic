import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  @ApiOperation({
    summary: 'Platform-wide subscription revenue overview (Super Admin)',
  })
  getRevenue() {
    return this.analyticsService.getRevenueOverview();
  }
}
