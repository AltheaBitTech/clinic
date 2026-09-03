import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  findAllPlatform(role?: UserRole, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (role) where.role = role;

    return this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
        tenant: { select: { id: true, name: true } },
      },
    });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user?.isActive },
    });

    try {
      await this.emailService.sendAccountStatusChanged({
        recipientEmail: updated.email,
        userName: `${updated.firstName} ${updated.lastName}`.trim(),
        isActive: updated.isActive,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Account status email failed (userId=${updated.id}, error=${message})`,
      );
    }

    return updated;
  }

  async updateProfile(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        ...(data.whatsappOptIn !== undefined && {
          whatsappOptIn: data.whatsappOptIn,
          whatsappOptInAt: data.whatsappOptIn ? new Date() : null,
        }),
      },
    });
  }
}
