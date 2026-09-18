import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PathologyLabsModule } from '../pathology-labs/pathology-labs.module';
import { PathologySharedModule } from '../pathology-shared/pathology-shared.module';
import { PathologyResultsController } from './pathology-results.controller';
import { PathologyResultsService } from './pathology-results.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    NotificationsModule,
    PathologyLabsModule,
    PathologySharedModule,
  ],
  controllers: [PathologyResultsController],
  providers: [PathologyResultsService],
  exports: [PathologyResultsService],
})
export class PathologyResultsModule {}
