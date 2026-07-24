import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Get or create a chat room between doctor and patient' })
  getOrCreateRoom(@Body() body: { patientId: string; doctorId: string }, @CurrentUser() user: any) {
    return this.chatService.getOrCreateRoom(body.patientId, body.doctorId, user.tenantId);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Get all chat rooms for current user' })
  getUserRooms(@CurrentUser() user: any) {
    return this.chatService.getUserRooms(user.id);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get messages in a chat room' })
  getMessages(@Param('roomId') roomId: string, @Query('page') page?: number) {
    return this.chatService.getRoomMessages(roomId, page);
  }
}
