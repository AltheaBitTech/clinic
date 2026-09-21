import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class PharmacySuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertNoDuplicate(
    pharmacyId: string,
    dto: { name?: string; phone?: string; email?: string; gstin?: string },
    excludeId?: string,
  ) {
    if (dto.gstin) {
      const byGstin = await this.prisma.supplier.findFirst({
        where: {
          pharmacyId,
          gstin: dto.gstin,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (byGstin)
        throw new ConflictException(
          'A supplier with this GSTIN already exists',
        );
    }

    if (dto.phone) {
      const byPhone = await this.prisma.supplier.findFirst({
        where: {
          pharmacyId,
          phone: dto.phone,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (byPhone)
        throw new ConflictException(
          'A supplier with this phone number already exists',
        );
    }

    if (dto.email) {
      const byEmail = await this.prisma.supplier.findFirst({
        where: {
          pharmacyId,
          email: { equals: dto.email, mode: 'insensitive' },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (byEmail)
        throw new ConflictException(
          'A supplier with this email already exists',
        );
    }

    if (dto.name) {
      const byName = await this.prisma.supplier.findFirst({
        where: {
          pharmacyId,
          name: { equals: dto.name, mode: 'insensitive' },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (byName)
        throw new ConflictException(
          'A supplier with this name already exists',
        );
    }
  }

  async create(pharmacyId: string, dto: CreateSupplierDto) {
    await this.assertNoDuplicate(pharmacyId, dto);
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
    await this.assertNoDuplicate(pharmacyId, dto, id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }
}
