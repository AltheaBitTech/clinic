import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PharmaciesModule } from '../pharmacies/pharmacies.module';
import { PharmacyReportsController } from './pharmacy-reports.controller';
import { PharmacyReportsService } from './pharmacy-reports.service';

@Module({
  imports: [PrismaModule, PharmaciesModule],
  controllers: [PharmacyReportsController],
  providers: [PharmacyReportsService],
})
export class PharmacyReportsModule {}
