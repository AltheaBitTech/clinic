import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ClientErrorDto {
  @ApiProperty({ description: 'Error message', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  message: string;

  @ApiPropertyOptional({ description: 'Error name, e.g. TypeError' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'JS stack trace', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  stack?: string;

  @ApiPropertyOptional({
    description: 'Page pathname where the error happened (no query string)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  path?: string;

  @ApiPropertyOptional({ description: 'Next.js error digest' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  digest?: string;

  @ApiPropertyOptional({ enum: ['boundary', 'global-boundary', 'window', 'promise'] })
  @IsOptional()
  @IsIn(['boundary', 'global-boundary', 'window', 'promise'])
  kind?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  userAgent?: string;
}
