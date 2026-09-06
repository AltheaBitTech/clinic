import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { RegisterReferralDto } from './dto/register-referral.dto';
import { UpdateReferralProfileDto } from './dto/update-referral-profile.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, RequestStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Self-register as a referral partner' })
  register(@Body() dto: RegisterReferralDto) {
    return this.referralsService.register(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all referral signups [SuperAdmin]' })
  findAll(@Query('status') status?: RequestStatus) {
    return this.referralsService.findAll(status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a referral signup [SuperAdmin]' })
  approve(@Param('id') id: string, @CurrentUser('id') approverId: string) {
    return this.referralsService.approve(id, approverId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a referral signup [SuperAdmin]' })
  reject(@Param('id') id: string, @CurrentUser('id') rejecterId: string) {
    return this.referralsService.reject(id, rejecterId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @Roles(UserRole.REFERRAL)
  @ApiOperation({ summary: 'Get my referral profile [Referral]' })
  getMe(@CurrentUser('id') userId: string) {
    return this.referralsService.getMe(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @Roles(UserRole.REFERRAL)
  @ApiOperation({ summary: 'Update my referral profile [Referral]' })
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReferralProfileDto,
  ) {
    return this.referralsService.updateMe(userId, dto);
  }
}
