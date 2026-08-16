import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PharmaciesModule } from '../pharmacies/pharmacies.module';
import { PharmacySuppliersController } from './pharmacy-suppliers.controller';
import { PharmacySuppliersService } from './pharmacy-suppliers.service';

@Module({
  imports: [PrismaModule, PharmaciesModule],
  controllers: [PharmacySuppliersController],
  providers: [PharmacySuppliersService],
  exports: [PharmacySuppliersService],
})
export class PharmacySuppliersModule {}
