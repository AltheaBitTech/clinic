import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PharmaciesModule } from '../pharmacies/pharmacies.module';
import { PharmacySharedModule } from '../pharmacy-shared/pharmacy-shared.module';
import { PharmacyPurchasesController } from './pharmacy-purchases.controller';
import { PharmacyPurchasesService } from './pharmacy-purchases.service';

@Module({
  imports: [PrismaModule, PharmaciesModule, PharmacySharedModule],
  controllers: [PharmacyPurchasesController],
  providers: [PharmacyPurchasesService],
  exports: [PharmacyPurchasesService],
})
export class PharmacyPurchasesModule {}
