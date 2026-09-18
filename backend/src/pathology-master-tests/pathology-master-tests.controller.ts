import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateMasterTestDto,
  UpdateMasterTestDto,
} from './dto/master-test.dto';
import { PathologyMasterTestsService } from './pathology-master-tests.service';

@ApiTags('pathology-master-tests')
@ApiBearerAuth()
@Controller('pathology/master-tests')
export class PathologyMasterTestsController {
  constructor(
    private readonly masterTestsService: PathologyMasterTestsService,
  ) {}

  @Get()
  @Roles(UserRole.PATHOLOGY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List/search the shared master test catalog' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('department') department?: string,
    @Query('limit') limit?: string,
  ) {
    return this.masterTestsService.findAll(
      search,
      category,
      department,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':id')
  @Roles(UserRole.PATHOLOGY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a master test by ID' })
  async findOne(@Param('id') id: string) {
    return this.masterTestsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create a master test (platform-curated reference data)',
  })
  async create(@Body() dto: CreateMasterTestDto) {
    return this.masterTestsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update a master test (or soft-deactivate via isActive)',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateMasterTestDto) {
    return this.masterTestsService.update(id, dto);
  }
}
