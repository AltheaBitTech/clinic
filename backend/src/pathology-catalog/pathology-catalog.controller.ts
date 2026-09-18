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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PathologyLabsService } from '../pathology-labs/pathology-labs.service';
import { CreateLabTestDto, UpdateLabTestDto } from './dto/lab-test.dto';
import { PathologyCatalogService } from './pathology-catalog.service';

@ApiTags('pathology-tests')
@ApiBearerAuth()
@Controller('pathology/tests')
@Roles(UserRole.PATHOLOGY)
export class PathologyCatalogController {
  constructor(
    private readonly catalogService: PathologyCatalogService,
    private readonly pathologyLabsService: PathologyLabsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a test in this lab's catalog" })
  async create(@CurrentUser() user: any, @Body() dto: CreateLabTestDto) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.catalogService.create(lab.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List/search this lab's test catalog" })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@CurrentUser() user: any, @Query('search') search?: string) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.catalogService.findAll(lab.id, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a test by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.catalogService.findOne(id, lab.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a test (or soft-deactivate via isActive)' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLabTestDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.catalogService.update(id, lab.id, dto);
  }
}
