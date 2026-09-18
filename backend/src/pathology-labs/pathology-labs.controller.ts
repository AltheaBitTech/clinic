import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdatePathologyLabDto } from './dto/pathology-lab.dto';
import { PathologyLabsService } from './pathology-labs.service';

@ApiTags('pathology-labs')
@ApiBearerAuth()
@Controller('pathology-labs')
export class PathologyLabsController {
  constructor(private readonly pathologyLabsService: PathologyLabsService) {}

  @Get('me')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: "Get the logged-in lab's own profile" })
  getMine(@CurrentUser() user: any) {
    return this.pathologyLabsService.getMine(user.id);
  }

  @Put('me')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: "Update the logged-in lab's own profile" })
  updateMine(@CurrentUser() user: any, @Body() dto: UpdatePathologyLabDto) {
    return this.pathologyLabsService.updateMine(user.id, dto);
  }

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Browse the directory of active pathology labs' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or city',
  })
  findAll(@Query('search') search?: string) {
    return this.pathologyLabsService.findAll(search);
  }

  @Get(':id')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get a pathology lab profile by ID' })
  findOne(@Param('id') id: string) {
    return this.pathologyLabsService.findOne(id);
  }
}
