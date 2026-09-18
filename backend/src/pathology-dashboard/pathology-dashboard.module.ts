import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PathologyLabsModule } from '../pathology-labs/pathology-labs.module';
import { PathologyDashboardController } from './pathology-dashboard.controller';
import { PathologyDashboardService } from './pathology-dashboard.service';

@Module({
  imports: [PrismaModule, PathologyLabsModule],
  controllers: [PathologyDashboardController],
  providers: [PathologyDashboardService],
})
export class PathologyDashboardModule {}
