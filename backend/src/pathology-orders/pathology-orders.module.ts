import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PathologyLabsModule } from '../pathology-labs/pathology-labs.module';
import { HospitalLabLinksModule } from '../hospital-lab-links/hospital-lab-links.module';
import { PathologySharedModule } from '../pathology-shared/pathology-shared.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PathologyOrdersController } from './pathology-orders.controller';
import { PathologyOrdersService } from './pathology-orders.service';

@Module({
  imports: [
    PrismaModule,
    PathologyLabsModule,
    HospitalLabLinksModule,
    PathologySharedModule,
    NotificationsModule,
  ],
  controllers: [PathologyOrdersController],
  providers: [PathologyOrdersService],
  exports: [PathologyOrdersService],
})
export class PathologyOrdersModule {}
