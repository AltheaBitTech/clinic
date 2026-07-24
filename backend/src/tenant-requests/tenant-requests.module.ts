import { Module } from '@nestjs/common';
import { TenantRequestsController } from './tenant-requests.controller';
import { TenantRequestsService } from './tenant-requests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TenantRequestsController],
  providers: [TenantRequestsService],
  exports: [TenantRequestsService],
})
export class TenantRequestsModule {}
