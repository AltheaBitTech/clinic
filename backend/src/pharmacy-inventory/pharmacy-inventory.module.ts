import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PharmaciesModule } from '../pharmacies/pharmacies.module';
import { PharmacySharedModule } from '../pharmacy-shared/pharmacy-shared.module';
import { PharmacyInventoryController } from './pharmacy-inventory.controller';
import { PharmacyInventoryService } from './pharmacy-inventory.service';

@Module({
  imports: [PrismaModule, PharmaciesModule, PharmacySharedModule],
  controllers: [PharmacyInventoryController],
  providers: [PharmacyInventoryService],
  exports: [PharmacyInventoryService],
})
export class PharmacyInventoryModule {}
