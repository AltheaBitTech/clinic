import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePharmacyPatientDto } from './dto/pharmacy-patient.dto';

@Injectable()
export class PharmacyPatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(pharmacyId: string, dto: CreatePharmacyPatientDto) {
    return this.prisma.pharmacyPatient.create({ data: { pharmacyId, ...dto } });
  }

  async findAll(pharmacyId: string, search?: string) {
    return this.prisma.pharmacyPatient.findMany({
      where: {
        pharmacyId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const patient = await this.prisma.pharmacyPatient.findFirst({
      where: { id, pharmacyId },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }
}
