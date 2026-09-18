import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateHospitalLabLinkDto } from './dto/hospital-lab-link.dto';
import { HospitalLabLinksService } from './hospital-lab-links.service';

const HOSPITAL_ROLES = [
  UserRole.HOSPITAL_ADMIN,
  UserRole.DOCTOR,
  UserRole.RECEPTIONIST,
];

@ApiTags('hospital-lab-links')
@ApiBearerAuth()
@Controller('hospital-lab-links')
export class HospitalLabLinksController {
  constructor(
    private readonly hospitalLabLinksService: HospitalLabLinksService,
  ) {}

  @Post()
  @Roles(...HOSPITAL_ROLES)
  @ApiOperation({ summary: 'Request a link with a pathology lab' })
  requestLink(@CurrentUser() user: any, @Body() dto: CreateHospitalLabLinkDto) {
    return this.hospitalLabLinksService.requestLink(
      user.tenantId,
      user.id,
      dto,
    );
  }

  @Get()
  @Roles(...HOSPITAL_ROLES)
  @ApiOperation({ summary: "List this hospital's lab links (any status)" })
  findForHospital(@CurrentUser() user: any) {
    return this.hospitalLabLinksService.findForHospital(user.tenantId);
  }

  @Get('incoming')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'List hospital link requests targeting this lab' })
  findIncoming(@CurrentUser() user: any) {
    return this.hospitalLabLinksService.findIncomingForLab(user.id);
  }

  @Put(':id/approve')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Approve an incoming hospital link request' })
  approve(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hospitalLabLinksService.approve(id, user.id);
  }

  @Put(':id/reject')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Reject an incoming hospital link request' })
  reject(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hospitalLabLinksService.reject(id, user.id);
  }

  @Put(':id/revoke')
  @Roles(...HOSPITAL_ROLES, UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Revoke an active link (either side)' })
  revoke(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hospitalLabLinksService.revoke(id, user);
  }
}
