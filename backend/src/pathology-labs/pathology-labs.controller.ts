import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CompletePathologyLabInviteDto,
  InvitePathologyLabDto,
  UpdatePathologyLabDto,
} from './dto/pathology-lab.dto';
import { PathologyLabsService } from './pathology-labs.service';

@ApiTags('pathology-labs')
@ApiBearerAuth()
@Controller('pathology-labs')
export class PathologyLabsController {
  constructor(private readonly pathologyLabsService: PathologyLabsService) {}

  @Post('invite')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary:
      'Generate a one-time self-registration link for an independent pathology lab',
  })
  createInvite(
    @CurrentUser() user: any,
    @Body() dto: InvitePathologyLabDto,
  ) {
    return this.pathologyLabsService.createInvite(
      user.tenantId,
      user.id,
      dto.email,
    );
  }

  @Get('invite/:token')
  @Public()
  @ApiOperation({
    summary: 'Validate a pathology lab self-registration invite link',
  })
  getInvite(@Param('token') token: string) {
    return this.pathologyLabsService.getInvite(token);
  }

  @Post('invite/:token/complete')
  @Public()
  @ApiOperation({
    summary: 'Complete pathology lab self-registration via invite link',
  })
  completeInvite(
    @Param('token') token: string,
    @Body() dto: CompletePathologyLabInviteDto,
  ) {
    return this.pathologyLabsService.completeInvite(token, dto);
  }

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

  @Get(':id/stats')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: "Get a pathology lab's turnaround-time stats" })
  getStats(@Param('id') id: string) {
    return this.pathologyLabsService.getStats(id);
  }
}
