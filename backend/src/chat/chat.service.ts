import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateRoom(patientId: string, doctorId: string, tenantId: string) {
    let room = await this.prisma.chatRoom.findUnique({
      where: { patientId_doctorId: { patientId, doctorId } },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: { patientId, doctorId, tenantId },
      });
    }

    return room;
  }

  async getRoomMessages(roomId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatRoomId: roomId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
        },
      }),
      this.prisma.message.count({ where: { chatRoomId: roomId } }),
    ]);

    return { messages: messages.reverse(), total, page, limit };
  }

  async getUserRooms(userId: string) {
    // Get rooms where user is patient or doctor
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true, doctor: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.patient) {
      return this.prisma.chatRoom.findMany({
        where: { patientId: user.patient.id },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    }

    if (user.doctor) {
      return this.prisma.chatRoom.findMany({
        where: { doctorId: user.doctor.id },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    }

    return [];
  }
}
