import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PathologyLabsModule } from '../pathology-labs/pathology-labs.module';
import { PathologyReportsController } from './pathology-reports.controller';
import { PathologyReportsService } from './pathology-reports.service';

@Module({
  imports: [PrismaModule, PathologyLabsModule],
  controllers: [PathologyReportsController],
  providers: [PathologyReportsService],
})
export class PathologyReportsModule {}
