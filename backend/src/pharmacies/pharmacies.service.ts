import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePharmacyDto, UpdatePharmacyDto } from './dto/pharmacy.dto';

@Injectable()
export class PharmaciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePharmacyDto) {
    return this.prisma.pharmacy.create({
      data: {
        tenantId,
        ...dto,
      },
    });
  }

  async findAll(tenantId: string, search?: string) {
    return this.prisma.pharmacy.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { ownerName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const pharmacy = await this.prisma.pharmacy.findFirst({
      where: { id, tenantId },
    });
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');
    return pharmacy;
  }

  async update(id: string, tenantId: string, dto: UpdatePharmacyDto) {
    await this.findOne(id, tenantId);
    return this.prisma.pharmacy.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.pharmacy.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
