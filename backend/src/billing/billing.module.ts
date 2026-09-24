import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { RazorpayService } from '../subscriptions/razorpay.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, RazorpayService],
})
export class BillingModule {}
