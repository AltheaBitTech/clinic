import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabTestDto, UpdateLabTestDto } from './dto/lab-test.dto';

@Injectable()
export class PathologyCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(labId: string, dto: CreateLabTestDto) {
    const { parameters, ...rest } = dto;
    if (rest.masterTestId) {
      const masterTest = await this.prisma.pathologyMasterTest.findUnique({
        where: { id: rest.masterTestId },
      });
      if (!masterTest) throw new BadRequestException('Master test not found');
    }
    return this.prisma.labTestCatalog.create({
      data: {
        labId,
        ...rest,
        parameters: parameters?.length ? { create: parameters } : undefined,
      },
      include: { parameters: true },
    });
  }

  async findAll(labId: string, search?: string) {
    return this.prisma.labTestCatalog.findMany({
      where: {
        labId,
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { parameters: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, labId: string) {
    const test = await this.prisma.labTestCatalog.findFirst({
      where: { id, labId },
      include: { parameters: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!test) throw new NotFoundException('Lab test not found');
    return test;
  }

  async update(id: string, labId: string, dto: UpdateLabTestDto) {
    await this.findOne(id, labId);
    const { parameters, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (parameters) {
        await tx.labTestParameterDef.deleteMany({ where: { testId: id } });
      }
      return tx.labTestCatalog.update({
        where: { id },
        data: {
          ...rest,
          parameters: parameters?.length ? { create: parameters } : undefined,
        },
        include: { parameters: true },
      });
    });
  }
}
