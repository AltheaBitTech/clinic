import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PharmaciesService } from '../pharmacies/pharmacies.service';
import { PharmacyDashboardService } from './pharmacy-dashboard.service';

@ApiTags('pharmacy-dashboard')
@ApiBearerAuth()
@Controller('pharmacy/dashboard')
@Roles(UserRole.PHARMACY)
export class PharmacyDashboardController {
  constructor(
    private readonly dashboardService: PharmacyDashboardService,
    private readonly pharmaciesService: PharmaciesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Pharmacy dashboard summary' })
  async summary(@CurrentUser() user: any) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.dashboardService.summary(pharmacy.id);
  }
}
