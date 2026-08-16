import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class PharmacySuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(pharmacyId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: { pharmacyId, ...dto } });
  }

  async findAll(
    pharmacyId: string,
    search?: string,
    includeInactive?: boolean,
  ) {
    return this.prisma.supplier.findMany({
      where: {
        pharmacyId,
        ...(includeInactive ? {} : { isActive: true }),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, pharmacyId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: string, pharmacyId: string, dto: UpdateSupplierDto) {
    await this.findOne(id, pharmacyId);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }
}
