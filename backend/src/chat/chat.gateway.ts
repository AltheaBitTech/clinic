import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private connectedUsers = new Map<string, string>(); // userId → socketId

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      console.log(`[CHAT] User ${userId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`[CHAT] User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    client.emit('joined_room', { roomId: data.roomId });
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { chatRoomId: string; senderId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      let room = await this.prisma.chatRoom.findUnique({
        where: { id: data.chatRoomId },
        include: {
          patient: { select: { userId: true } },
          doctor: { select: { userId: true } },
        },
      });

      if (!room) {
        return client.emit('error', { message: 'Chat room not found' });
      }

      const message = await this.prisma.message.create({
        data: {
          chatRoomId: data.chatRoomId,
          senderId: data.senderId,
          content: data.content,
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
        },
      });

      this.server.to(data.chatRoomId).emit('new_message', message);

      const recipientUserId =
        room.patient.userId === data.senderId ? room.doctor.userId : room.patient.userId;
      const senderName = `${message.sender.firstName} ${message.sender.lastName}`.trim();

      const notification = await this.prisma.notification.create({
        data: {
          userId: recipientUserId,
          title: `New message from ${senderName}`,
          body: data.content.length > 120 ? `${data.content.slice(0, 120)}…` : data.content,
          channel: 'PUSH',
          scheduledAt: new Date(),
        },
      });

      const recipientSocketId = this.connectedUsers.get(recipientUserId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('new_notification', notification);
      }
    } catch (err) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { chatRoomId: string; userId: string },
  ) {
    await this.prisma.message.updateMany({
      where: { chatRoomId: data.chatRoomId, senderId: { not: data.userId }, readAt: null },
      data: { readAt: new Date() },
    });
    this.server.to(data.chatRoomId).emit('messages_read', { chatRoomId: data.chatRoomId });
  }
}
