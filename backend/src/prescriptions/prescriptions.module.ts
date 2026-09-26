import { Module } from '@nestjs/common';
import { PharmacyPrescriptionsModule } from '../pharmacy-prescriptions/pharmacy-prescriptions.module';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';

@Module({
  imports: [PharmacyPrescriptionsModule],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
