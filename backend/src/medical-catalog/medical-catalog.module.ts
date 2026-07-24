import { Module } from '@nestjs/common';
import { MedicalCatalogController } from './medical-catalog.controller';
import { MedicalCatalogService } from './medical-catalog.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MedicalCatalogController],
  providers: [MedicalCatalogService],
  exports: [MedicalCatalogService],
})
export class MedicalCatalogModule {}
