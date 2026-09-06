import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { RemindersService } from './reminders.service';

@Controller('reminders/cron')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  private assertCronSecret(authHeader?: string) {
    const expected = process.env.CRON_SECRET;
    if (!expected || authHeader !== `Bearer ${expected}`) {
      throw new UnauthorizedException();
    }
  }

  @Public()
  @Get('medicine')
  async triggerMedicineReminders(@Headers('authorization') authHeader?: string) {
    this.assertCronSecret(authHeader);
    return this.remindersService.processReminders();
  }

  @Public()
  @Get('appointments')
  async triggerAppointmentReminders(@Headers('authorization') authHeader?: string) {
    this.assertCronSecret(authHeader);
    return this.remindersService.processAppointmentReminders();
  }
}
