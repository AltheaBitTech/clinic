import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMasterTestDto,
  UpdateMasterTestDto,
} from './dto/master-test.dto';

@Injectable()
export class PathologyMasterTestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMasterTestDto) {
    const { parameters, ...rest } = dto;
    return this.prisma.pathologyMasterTest.create({
      data: {
        ...rest,
        parameters: parameters?.length ? { create: parameters } : undefined,
      },
      include: { parameters: { orderBy: { displayOrder: 'asc' } } },
    });
  }

  async findAll(
    search?: string,
    category?: string,
    department?: string,
    limit = 20,
  ) {
    return this.prisma.pathologyMasterTest.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(department ? { department } : {}),
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
      include: { parameters: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { name: 'asc' },
      take: limit,
    });
  }

  async findOne(id: string) {
    const test = await this.prisma.pathologyMasterTest.findUnique({
      where: { id },
      include: { parameters: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!test) throw new NotFoundException('Master test not found');
    return test;
  }

  async update(id: string, dto: UpdateMasterTestDto) {
    await this.findOne(id);
    const { parameters, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (parameters) {
        await tx.pathologyMasterTestParameter.deleteMany({
          where: { masterTestId: id },
        });
      }
      return tx.pathologyMasterTest.update({
        where: { id },
        data: {
          ...rest,
          parameters: parameters?.length ? { create: parameters } : undefined,
        },
        include: { parameters: { orderBy: { displayOrder: 'asc' } } },
      });
    });
  }
}
