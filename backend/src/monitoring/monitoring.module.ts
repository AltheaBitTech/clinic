import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { ErrorAlertService } from './error-alert.service';
import { MonitoringController } from './monitoring.controller';

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [MonitoringController],
  providers: [
    ErrorAlertService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
  exports: [ErrorAlertService],
})
export class MonitoringModule {}
