import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PathologyMasterTestsController } from './pathology-master-tests.controller';
import { PathologyMasterTestsService } from './pathology-master-tests.service';

@Module({
  imports: [PrismaModule],
  controllers: [PathologyMasterTestsController],
  providers: [PathologyMasterTestsService],
  exports: [PathologyMasterTestsService],
})
export class PathologyMasterTestsModule {}
