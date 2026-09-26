import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PathologyLabsModule } from '../pathology-labs/pathology-labs.module';
import { HospitalLabLinksModule } from '../hospital-lab-links/hospital-lab-links.module';
import { PathologyCatalogController } from './pathology-catalog.controller';
import { PathologyCatalogService } from './pathology-catalog.service';

@Module({
  imports: [PrismaModule, PathologyLabsModule, HospitalLabLinksModule],
  controllers: [PathologyCatalogController],
  providers: [PathologyCatalogService],
  exports: [PathologyCatalogService],
})
export class PathologyCatalogModule {}
