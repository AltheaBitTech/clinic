import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PathologyLabsService } from '../pathology-labs/pathology-labs.service';
import { PathologyDashboardService } from './pathology-dashboard.service';

@ApiTags('pathology-dashboard')
@ApiBearerAuth()
@Controller('pathology-dashboard')
@Roles(UserRole.PATHOLOGY)
export class PathologyDashboardController {
  constructor(
    private readonly dashboardService: PathologyDashboardService,
    private readonly pathologyLabsService: PathologyLabsService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: "Summary widget for the logged-in lab's dashboard" })
  async summary(@CurrentUser() user: any) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.dashboardService.summary(lab.id);
  }

  @Get('pending-by-department')
  @ApiOperation({ summary: 'Pending (non-finalized) order items grouped by department' })
  async pendingByDepartment(@CurrentUser() user: any) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.dashboardService.pendingByDepartment(lab.id);
  }
}
