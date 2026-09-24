import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'Razorpay order id returned by create-payment-order',
  })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({
    description: 'Razorpay payment id returned by the checkout widget',
  })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({
    description: 'Razorpay signature returned by the checkout widget',
  })
  @IsString()
  razorpaySignature: string;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Payment method the patient selected',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
