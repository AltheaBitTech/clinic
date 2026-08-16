import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PharmaciesModule } from '../pharmacies/pharmacies.module';
import { PharmacySharedModule } from '../pharmacy-shared/pharmacy-shared.module';
import { PharmacySalesController } from './pharmacy-sales.controller';
import { PharmacySalesService } from './pharmacy-sales.service';

@Module({
  imports: [PrismaModule, PharmaciesModule, PharmacySharedModule],
  controllers: [PharmacySalesController],
  providers: [PharmacySalesService],
  exports: [PharmacySalesService],
})
export class PharmacySalesModule {}
