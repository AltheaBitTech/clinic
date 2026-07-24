import { Controller, Get, Put, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  getAll(@CurrentUser() user: any, @Query('page') page?: number) {
    return this.svc.getUserNotifications(user.id, page);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Param('id') id: string) {
    return this.svc.markAsRead(id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: any) {
    return this.svc.markAllAsRead(user.id);
  }
}
