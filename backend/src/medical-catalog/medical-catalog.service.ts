import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMedicalCatalogItemDto,
  UpdateMedicalCatalogItemDto,
} from './dto/medical-catalog.dto';

@Injectable()
export class MedicalCatalogService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateMedicalCatalogItemDto) {
    return this.prisma.medicalCatalogItem.upsert({
      where: {
        tenantId_name_type: {
          tenantId,
          name: dto.name,
          type: dto.type,
        },
      },
      update: {
        dosage: dto.dosage,
        frequency: dto.frequency,
        timing: dto.timing,
      },
      create: {
        tenantId,
        name: dto.name,
        type: dto.type,
        dosage: dto.dosage,
        frequency: dto.frequency,
        timing: dto.timing,
      },
    });
  }

  async findAll(
    tenantId: string,
    type?: string,
    search?: string,
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    return this.prisma.medicalCatalogItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.prisma.medicalCatalogItem.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException('Catalog item not found');
    return item;
  }

  async update(tenantId: string, id: string, dto: UpdateMedicalCatalogItemDto) {
    await this.findOne(tenantId, id);
    return this.prisma.medicalCatalogItem.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        dosage: dto.dosage,
        frequency: dto.frequency,
        timing: dto.timing,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.medicalCatalogItem.delete({
      where: { id },
    });
  }
}
