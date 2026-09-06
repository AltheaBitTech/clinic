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
import { UpdateReferralCommissionDto } from './dto/update-referral-commission.dto';
import { RecordReferralPayoutDto } from './dto/record-referral-payout.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, RequestStatus, KycStatus, TenantType } from '@prisma/client';
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
  @Patch(':id/commission')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Set a referral partner's commission percentage [SuperAdmin]",
  })
  updateCommission(
    @Param('id') id: string,
    @Body() dto: UpdateReferralCommissionDto,
  ) {
    return this.referralsService.updateCommission(id, dto.commissionPercent);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/commissions')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List commission ledger entries for a referral partner [SuperAdmin]',
  })
  getCommissions(@Param('id') id: string) {
    return this.referralsService.getCommissions(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('pending-payouts')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List referral partners with an outstanding payout balance [SuperAdmin]',
  })
  getPendingPayouts() {
    return this.referralsService.getPendingPayoutsOverview();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/earnings-summary')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get a referral partner's earned/paid/pending totals [SuperAdmin]",
  })
  getEarningsSummary(@Param('id') id: string) {
    return this.referralsService.getEarningsSummary(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/payouts')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Record a manual commission payout for a referral partner [SuperAdmin]',
  })
  recordPayout(
    @Param('id') id: string,
    @CurrentUser('id') recorderId: string,
    @Body() dto: RecordReferralPayoutDto,
  ) {
    return this.referralsService.recordPayout(id, recorderId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/payouts')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List payout history for a referral partner [SuperAdmin]' })
  getPayouts(@Param('id') id: string) {
    return this.referralsService.getPayouts(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/earnings-summary')
  @Roles(UserRole.REFERRAL)
  @ApiOperation({ summary: 'Get my earned/paid/pending totals [Referral]' })
  getMyEarningsSummary(@CurrentUser('id') userId: string) {
    return this.referralsService.getMyEarningsSummary(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/payouts')
  @Roles(UserRole.REFERRAL)
  @ApiOperation({ summary: 'List my payout history [Referral]' })
  getMyPayouts(@CurrentUser('id') userId: string) {
    return this.referralsService.getMyPayouts(userId);
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
  @Get('me/referred-tenants')
  @Roles(UserRole.REFERRAL)
  @ApiOperation({
    summary:
      'List hospitals/pharmacies that signed up with my referral code [Referral]',
  })
  getMyReferredTenants(
    @CurrentUser('id') userId: string,
    @Query('type') type?: TenantType,
  ) {
    return this.referralsService.getMyReferredTenants(userId, type);
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
