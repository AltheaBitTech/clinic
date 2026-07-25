import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ description: 'The unique identifier of the patient' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'The unique identifier of the doctor' })
  @IsString()
  doctorId: string;
}
