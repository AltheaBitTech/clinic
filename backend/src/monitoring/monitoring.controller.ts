import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Ip,
  Post,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ClientErrorDto } from './dto/client-error.dto';
import { ErrorAlertService } from './error-alert.service';

const CLIENT_ERROR_LIMIT_PER_MINUTE = 20;

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  // Per-instance spam guard only; real dedupe is the DB fingerprint.
  private readonly clientErrorHits = new Map<string, number[]>();

  constructor(
    private readonly errorAlerts: ErrorAlertService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /** Frontend error boundaries / window.onerror report here. */
  @Public()
  @Post('client-error')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reportClientError(
    @Body() dto: ClientErrorDto,
    @Ip() ip: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<void> {
    if (this.isRateLimited(ip)) return;

    const error = new Error(dto.message);
    error.name = dto.name || 'ClientError';
    error.stack = dto.stack || `${error.name}: ${dto.message}`;

    const user = await this.resolveUser(authHeader);
    await this.errorAlerts.report(error, {
      source: 'client',
      route: dto.path?.split('?')[0],
      tenantId: user?.tenantId,
      userId: user?.id,
      role: user?.role,
      extra: {
        kind: dto.kind,
        digest: dto.digest,
        userAgent: dto.userAgent,
      },
    });
  }

  /** Deliberately fails so the alert pipeline can be verified end-to-end. */
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @Get('test-alert')
  testAlert(): never {
    throw new InternalServerErrorException(
      'Test alert triggered from /monitoring/test-alert',
    );
  }

  private async resolveUser(authHeader?: string) {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_SECRET,
      });
      return await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, tenantId: true },
      });
    } catch {
      return null;
    }
  }

  private isRateLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (this.clientErrorHits.get(ip) ?? []).filter(
      (t) => now - t < 60_000,
    );
    recent.push(now);
    this.clientErrorHits.set(ip, recent);
    if (this.clientErrorHits.size > 5000) this.clientErrorHits.clear();
    return recent.length > CLIENT_ERROR_LIMIT_PER_MINUTE;
  }
}
