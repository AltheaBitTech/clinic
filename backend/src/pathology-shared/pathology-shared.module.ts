import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LabAuditService } from './lab-audit.service';
import { LabCommissionService } from './lab-commission.service';

@Module({
  imports: [PrismaModule],
  providers: [LabAuditService, LabCommissionService],
  exports: [LabAuditService, LabCommissionService],
})
export class PathologySharedModule {}
