import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantRequestsService } from './tenant-requests.service';
import { CreateTenantRequestDto } from './dto/create-tenant-request.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tenant-requests')
@Controller('tenant-requests')
export class TenantRequestsController {
  constructor(private readonly tenantRequestsService: TenantRequestsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit a new clinic/hospital tenant request from landing page' })
  create(@Body() dto: CreateTenantRequestDto) {
    return this.tenantRequestsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all tenant requests [SuperAdmin]' })
  findAll() {
    return this.tenantRequestsService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a tenant registration request [SuperAdmin]' })
  approve(@Param('id') id: string) {
    return this.tenantRequestsService.approve(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a tenant registration request [SuperAdmin]' })
  reject(@Param('id') id: string) {
    return this.tenantRequestsService.reject(id);
  }
}
