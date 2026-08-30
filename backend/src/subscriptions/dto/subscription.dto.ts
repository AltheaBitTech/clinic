import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'The unique identifier of the Plan to subscribe to' })
  @IsString()
  planId: string;
}
