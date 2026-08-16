import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePharmacyMedicineDto,
  UpdatePharmacyMedicineDto,
} from './dto/pharmacy-medicine.dto';

@Injectable()
export class PharmacyCatalogService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll(pharmacyId: string, search?: string) {
    return this.prisma.pharmacyMedicine.findMany({
      where: {
        pharmacyId,
        isActive: true,
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

  async update(id: string, pharmacyId: string, dto: UpdatePharmacyMedicineDto) {
    await this.findOne(id, pharmacyId);
    return this.prisma.pharmacyMedicine.update({
      where: { id },
      data: dto,
    });
  }
}
