import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MedicalCatalogService } from './medical-catalog.service';
import { CreateMedicalCatalogItemDto } from './dto/medical-catalog.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('medical-catalog')
@ApiBearerAuth()
@Controller('medical-catalog')
export class MedicalCatalogController {
  constructor(private readonly svc: MedicalCatalogService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Add/update a medicine or ointment in the catalog' })
  create(@CurrentUser() user: any, @Body() dto: CreateMedicalCatalogItemDto) {
    return this.svc.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List medicines/ointments from the catalogue' })
  @ApiQuery({ name: 'type', required: false, description: 'MEDICINE or OINTMENT' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
  ) {
    return this.svc.findAll(user.tenantId, type, search, page);
  }

  @Delete(':id')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Remove a catalog item' })
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
