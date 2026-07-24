import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string, role?: UserRole, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (role) where.role = role;

    return this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, isActive: true, isVerified: true, avatarUrl: true, createdAt: true,
      },
    });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return this.prisma.user.update({ where: { id }, data: { isActive: !user?.isActive } });
  }

  async updateProfile(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data: { firstName: data.firstName, lastName: data.lastName, phone: data.phone, avatarUrl: data.avatarUrl },
    });
  }
}
