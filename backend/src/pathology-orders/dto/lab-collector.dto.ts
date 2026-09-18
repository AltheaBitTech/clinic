import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsPhoneNumber10 } from '../../common/validators/is-phone-number.validator';

export class CreateLabCollectorDto {
  @ApiProperty({ example: 'Suresh Kumar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsPhoneNumber10()
  phone: string;
}

export class UpdateLabCollectorDto extends PartialType(CreateLabCollectorDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
