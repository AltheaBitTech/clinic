import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PathologyLabsModule } from '../pathology-labs/pathology-labs.module';
import { HospitalLabLinksController } from './hospital-lab-links.controller';
import { HospitalLabLinksService } from './hospital-lab-links.service';

@Module({
  imports: [PrismaModule, PathologyLabsModule],
  controllers: [HospitalLabLinksController],
  providers: [HospitalLabLinksService],
  exports: [HospitalLabLinksService],
})
export class HospitalLabLinksModule {}
