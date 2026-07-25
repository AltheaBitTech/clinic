import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  create(tenantId: string, dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: { tenantId, ...dto } });
  }

  findAll(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { doctors: true } } },
    });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }
}
