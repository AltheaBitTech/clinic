import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PharmaciesModule } from '../pharmacies/pharmacies.module';
import { PharmacySharedModule } from '../pharmacy-shared/pharmacy-shared.module';
import { PharmacyPatientsController } from './pharmacy-patients.controller';
import { PharmacyPatientsService } from './pharmacy-patients.service';
import { PharmacyPrescriptionsController } from './pharmacy-prescriptions.controller';
import { PharmacyPrescriptionsService } from './pharmacy-prescriptions.service';

@Module({
  imports: [PrismaModule, PharmaciesModule, PharmacySharedModule],
  controllers: [PharmacyPatientsController, PharmacyPrescriptionsController],
  providers: [PharmacyPatientsService, PharmacyPrescriptionsService],
  exports: [PharmacyPatientsService, PharmacyPrescriptionsService],
})
export class PharmacyPrescriptionsModule {}
