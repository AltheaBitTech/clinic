import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePathologyLabDto } from './dto/pathology-lab.dto';

@Injectable()
export class PathologyLabsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Directory of active labs, browsable by hospital staff to pick one to link with. */
  async findAll(search?: string) {
    return this.prisma.pathologyLab.findMany({
      where: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const lab = await this.prisma.pathologyLab.findUnique({ where: { id } });
    if (!lab) throw new NotFoundException('Pathology lab not found');
    return lab;
  }

  async getMine(userId: string) {
    const lab = await this.prisma.pathologyLab.findUnique({
      where: { userId },
    });
    if (!lab) throw new NotFoundException('Pathology lab profile not found');
    return lab;
  }

  async updateMine(userId: string, dto: UpdatePathologyLabDto) {
    const lab = await this.getMine(userId);
    const { isActive: _isActive, ...rest } = dto;
    return this.prisma.pathologyLab.update({
      where: { id: lab.id },
      data: rest,
    });
  }
}
