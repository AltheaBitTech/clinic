import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PharmaciesModule } from '../pharmacies/pharmacies.module';
import { PharmacyCatalogController } from './pharmacy-catalog.controller';
import { PharmacyCatalogService } from './pharmacy-catalog.service';

@Module({
  imports: [PrismaModule, PharmaciesModule],
  controllers: [PharmacyCatalogController],
  providers: [PharmacyCatalogService],
  exports: [PharmacyCatalogService],
})
export class PharmacyCatalogModule {}
