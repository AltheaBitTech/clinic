import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PharmaciesModule } from '../pharmacies/pharmacies.module';
import { PharmacyDashboardController } from './pharmacy-dashboard.controller';
import { PharmacyDashboardService } from './pharmacy-dashboard.service';

@Module({
  imports: [PrismaModule, PharmaciesModule],
  controllers: [PharmacyDashboardController],
  providers: [PharmacyDashboardService],
})
export class PharmacyDashboardModule {}
