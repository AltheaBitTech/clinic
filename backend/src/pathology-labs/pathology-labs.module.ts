import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PathologyLabsController } from './pathology-labs.controller';
import { PathologyLabsService } from './pathology-labs.service';

@Module({
  imports: [PrismaModule],
  controllers: [PathologyLabsController],
  providers: [PathologyLabsService],
  exports: [PathologyLabsService],
})
export class PathologyLabsModule {}
