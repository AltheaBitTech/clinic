import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, InviteUserDto } from './dto/tenant.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new hospital/clinic tenant [SuperAdmin]' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all tenants [SuperAdmin]' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.tenantsService.findAll(page, limit);
  }

  @Get('my')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get current user tenant profile' })
  getMyTenant(@CurrentUser() user: any) {
    return this.tenantsService.findOne(user.tenantId);
  }

  @Get('my/stats')
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get hospital stats for current tenant' })
  getMyStats(@CurrentUser() user: any) {
    return this.tenantsService.getStats(user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get tenant by ID [SuperAdmin]' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Update tenant [SuperAdmin, HospitalAdmin]' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete tenant [SuperAdmin]' })
  delete(@Param('id') id: string) {
    return this.tenantsService.delete(id);
  }

  @Post(':id/invite')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Invite a user to the hospital' })
  invite(@Param('id') id: string, @Body() dto: InviteUserDto) {
    return this.tenantsService.inviteUser(id, dto);
  }
}
