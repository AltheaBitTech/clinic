import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateDepartmentDto) {
    const name = dto.name.trim();
    await this.assertNameAvailable(tenantId, name);
    return this.prisma.department.create({
      data: { tenantId, ...dto, name },
    });
  }

  findAll(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { doctors: true } } },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateDepartmentDto) {
    await this.findOneOrThrow(tenantId, id);
    const data = { ...dto };
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
      await this.assertNameAvailable(tenantId, data.name, id);
    }
    return this.prisma.department.update({ where: { id }, data });
  }

  async delete(tenantId: string, id: string) {
    await this.findOneOrThrow(tenantId, id);
    return this.prisma.department.delete({ where: { id } });
  }

  private async findOneOrThrow(tenantId: string, id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, tenantId },
    });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  // Department names are unique per tenant, case-insensitively
  // ("Orthopedics" and "orthopedics " are the same department).
  private async assertNameAvailable(
    tenantId: string,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.department.findFirst({
      where: {
        tenantId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    if (existing) {
      throw new ConflictException(
        `A department named "${existing.name}" already exists`,
      );
    }
  }
}
