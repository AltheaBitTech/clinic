import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHospitalLabLinkDto {
  @ApiProperty({
    example: 'clx1234abcd',
    description: 'PathologyLab id to request a link with',
  })
  @IsString()
  @IsNotEmpty()
  labId: string;

  @ApiPropertyOptional({ example: 'Looking to route routine blood work here' })
  @IsString()
  @IsOptional()
  notes?: string;
}
