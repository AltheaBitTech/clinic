import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Headers,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateCheckoutDto } from './dto/subscription.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private svc: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans' })
  getPlans() {
    return this.svc.getPlans();
  }

  @Get('me')
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: "Get the tenant's current subscription" })
  getCurrent(@CurrentUser() user: any) {
    return this.svc.getCurrent(user.tenantId);
  }

  @Post('checkout')
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Start a checkout for a plan' })
  checkout(@CurrentUser() user: any, @Body() dto: CreateCheckoutDto) {
    return this.svc.createCheckout(user.tenantId, dto.planId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Cancel a subscription at period end' })
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.cancelSubscription(user.tenantId, id);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook receiver' })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.svc.processWebhook(req.rawBody, signature, req.body);
  }
}
