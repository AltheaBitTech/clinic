import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StockService } from './stock.service';
import { PharmacyAuditService } from './pharmacy-audit.service';

@Module({
  imports: [PrismaModule],
  providers: [StockService, PharmacyAuditService],
  exports: [StockService, PharmacyAuditService],
})
export class PharmacySharedModule {}
