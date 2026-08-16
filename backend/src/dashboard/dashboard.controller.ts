import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('super-admin')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Super Admin platform dashboard' })
  getSuperAdmin() {
    return this.dashboardService.getSuperAdminDashboard();
  }

  @Get('hospital')
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Hospital Admin dashboard' })
  getHospital(@CurrentUser() user: any) {
    return this.dashboardService.getHospitalAdminDashboard(user.tenantId);
  }

  @Get('doctor')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor dashboard' })
  getDoctor(@CurrentUser() user: any) {
    return this.dashboardService.getDoctorDashboard(
      user.tenantId,
      user.doctor?.id,
    );
  }

  @Get('patient')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient dashboard' })
  getPatient(@CurrentUser() user: any) {
    return this.dashboardService.getPatientDashboard(user.patient?.id);
  }

  @Get('receptionist')
  @Roles(UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Receptionist dashboard' })
  getReceptionist(@CurrentUser() user: any) {
    return this.dashboardService.getReceptionistDashboard(user.tenantId);
  }
}
