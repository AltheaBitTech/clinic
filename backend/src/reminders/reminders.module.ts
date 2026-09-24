import { Module } from '@nestjs/common';
import { PharmacyInventoryModule } from '../pharmacy-inventory/pharmacy-inventory.module';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';

@Module({
  imports: [PharmacyInventoryModule],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
