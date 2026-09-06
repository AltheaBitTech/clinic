import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { RegisterReferralDto } from './dto/register-referral.dto';
import { UpdateReferralProfileDto } from './dto/update-referral-profile.dto';
import { RejectReferralKycDto } from './dto/reject-referral-kyc.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, RequestStatus, KycStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { kycFileUploadOptions } from '../common/utils/upload.util';

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/kyc')
  @Roles(UserRole.REFERRAL)
  @UseInterceptors(FileInterceptor('file', kycFileUploadOptions()))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit my KYC document [Referral]' })
  submitKyc(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.referralsService.submitKyc(userId, file);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/kyc')
  @Roles(UserRole.REFERRAL)
  @ApiOperation({ summary: 'Get my KYC status [Referral]' })
  getMyKyc(@CurrentUser('id') userId: string) {
    return this.referralsService.getMyKyc(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('kyc-requests')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List referral KYC submissions [SuperAdmin]' })
  findKycRequests(@Query('status') status?: KycStatus) {
    return this.referralsService.findKycRequests(status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/kyc/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a referral KYC submission [SuperAdmin]' })
  approveKyc(@Param('id') id: string, @CurrentUser('id') approverId: string) {
    return this.referralsService.approveKyc(id, approverId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/kyc/reject')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a referral KYC submission [SuperAdmin]' })
  rejectKyc(
    @Param('id') id: string,
    @CurrentUser('id') rejecterId: string,
    @Body() dto: RejectReferralKycDto,
  ) {
    return this.referralsService.rejectKyc(id, rejecterId, dto);
  }
}
