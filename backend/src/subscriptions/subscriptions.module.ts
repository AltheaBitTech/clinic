import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { RazorpayService } from './razorpay.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, RazorpayService],
})
export class SubscriptionsModule {}
