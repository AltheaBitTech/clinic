import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  OtpLoginDto,
  VerifyOtpDto,
  RefreshTokenDto,
  AcceptInviteDto,
  SendRegisterEmailOtpDto,
  VerifyRegisterEmailOtpDto,
} from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/send-email-otp')
  @ApiOperation({ summary: 'Send email OTP for patient self-registration' })
  sendRegisterEmailOtp(@Body() dto: SendRegisterEmailOtpDto) {
    return this.authService.sendRegisterEmailOtp(dto);
  }

  @Public()
  @Post('register/verify-email-otp')
  @ApiOperation({ summary: 'Verify email OTP and receive registration proof' })
  verifyRegisterEmailOtp(@Body() dto: VerifyRegisterEmailOtpDto) {
    return this.authService.verifyRegisterEmailOtp(dto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email & password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP to phone number' })
  sendOtp(@Body() dto: OtpLoginDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Public()
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and get tokens' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: any) {
    // Extract userId from refresh token without full validation
    try {
      const payload = JSON.parse(
        Buffer.from(dto.refreshToken.split('.')[1], 'base64').toString(),
      );
      return this.authService.refreshTokens(payload.sub, dto.refreshToken);
    } catch {
      return { message: 'Invalid refresh token' };
    }
  }

  @Public()
  @Post('invite/accept')
  @ApiOperation({ summary: 'Accept hospital invite and register' })
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Logout current user' })
  logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id);
  }
}
