import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PharmacyAuditService } from '../pharmacy-shared/pharmacy-audit.service';
import {
  CreatePharmacyMedicineDto,
  UpdatePharmacyMedicineDto,
} from './dto/pharmacy-medicine.dto';

@Injectable()
export class PharmacyCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: PharmacyAuditService,
  ) {}

  async create(pharmacyId: string, dto: CreatePharmacyMedicineDto) {
    if (dto.barcode) {
      const existing = await this.prisma.pharmacyMedicine.findUnique({
        where: { pharmacyId_barcode: { pharmacyId, barcode: dto.barcode } },
      });
      if (existing) throw new ConflictException('Barcode already in use');
    }
    return this.prisma.pharmacyMedicine.create({
      data: { pharmacyId, ...dto },
    });
  }

  async findAll(
    pharmacyId: string,
    search?: string,
    includeInactive?: boolean,
  ) {
    return this.prisma.pharmacyMedicine.findMany({
      where: {
        pharmacyId,
        ...(includeInactive ? {} : { isActive: true }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { genericName: { contains: search, mode: 'insensitive' } },
                { brandName: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const medicine = await this.prisma.pharmacyMedicine.findFirst({
      where: { id, pharmacyId },
    });
    if (!medicine) throw new NotFoundException('Medicine not found');
    return medicine;
  }

  async update(
    id: string,
    pharmacyId: string,
    userId: string,
    dto: UpdatePharmacyMedicineDto,
  ) {
    const existing = await this.findOne(id, pharmacyId);
    const updated = await this.prisma.pharmacyMedicine.update({
      where: { id },
      data: dto,
    });

    const mrpChanged =
      dto.mrp !== undefined && Number(dto.mrp) !== Number(existing.mrp);
    const salePriceChanged =
      dto.salePrice !== undefined &&
      Number(dto.salePrice) !== Number(existing.salePrice);

    if (mrpChanged || salePriceChanged) {
      await this.auditService.log(
        pharmacyId,
        userId,
        'PRICE_UPDATE',
        'PharmacyMedicine',
        id,
        { mrp: existing.mrp, salePrice: existing.salePrice },
        { mrp: updated.mrp, salePrice: updated.salePrice },
      );
    }

    return updated;
  }

  async priceHistory(id: string, pharmacyId: string) {
    await this.findOne(id, pharmacyId);
    const logs = await this.prisma.auditLog.findMany({
      where: {
        pharmacyId,
        entity: 'PharmacyMedicine',
        entityId: id,
        action: 'PRICE_UPDATE',
      },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = [...new Set(logs.map((l) => l.userId))];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    return logs.map((log) => {
      const user = userById.get(log.userId);
      return {
        id: log.id,
        changedAt: log.createdAt,
        changedBy: user
          ? `${user.firstName} ${user.lastName}`.trim()
          : 'Unknown user',
        changedByEmail: user?.email,
        before: log.beforeData,
        after: log.afterData,
      };
    });
  }
}
