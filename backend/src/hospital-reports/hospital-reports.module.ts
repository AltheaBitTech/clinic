import { Module } from '@nestjs/common';
import { HospitalReportsController } from './hospital-reports.controller';
import { HospitalReportsService } from './hospital-reports.service';

@Module({
  controllers: [HospitalReportsController],
  providers: [HospitalReportsService],
})
export class HospitalReportsModule {}
