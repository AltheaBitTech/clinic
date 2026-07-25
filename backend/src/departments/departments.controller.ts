import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private svc: DepartmentsService) {}

  @Post()
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  create(@CurrentUser() user: any, @Body() dto: CreateDepartmentDto) {
    return this.svc.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all departments' })
  findAll(@CurrentUser() user: any) {
    return this.svc.findAll(user.tenantId);
  }

  @Put(':id')
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Update a department' })
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Delete a department' })
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
