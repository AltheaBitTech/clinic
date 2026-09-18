import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LabLinkStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PathologyLabsService } from '../pathology-labs/pathology-labs.service';
import { CreateHospitalLabLinkDto } from './dto/hospital-lab-link.dto';

@Injectable()
export class HospitalLabLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pathologyLabsService: PathologyLabsService,
  ) {}

  async requestLink(
    hospitalTenantId: string,
    requestedById: string,
    dto: CreateHospitalLabLinkDto,
  ) {
    const lab = await this.pathologyLabsService.findOne(dto.labId);

    const existing = await this.prisma.hospitalLabLink.findUnique({
      where: {
        hospitalTenantId_labId: { hospitalTenantId, labId: lab.id },
      },
    });

    if (existing) {
      if (
        existing.status === LabLinkStatus.PENDING ||
        existing.status === LabLinkStatus.ACTIVE
      ) {
        throw new BadRequestException(
          `A ${existing.status.toLowerCase()} link with this lab already exists`,
        );
      }
      // Previously REJECTED or REVOKED — re-raise as a fresh request.
      return this.prisma.hospitalLabLink.update({
        where: { id: existing.id },
        data: {
          status: LabLinkStatus.PENDING,
          requestedById,
          requestedAt: new Date(),
          respondedById: null,
          respondedAt: null,
          notes: dto.notes,
        },
      });
    }

    return this.prisma.hospitalLabLink.create({
      data: {
        hospitalTenantId,
        labId: lab.id,
        requestedById,
        notes: dto.notes,
      },
    });
  }

  async findForHospital(hospitalTenantId: string) {
    return this.prisma.hospitalLabLink.findMany({
      where: { hospitalTenantId },
      include: { lab: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findIncomingForLab(userId: string) {
    const lab = await this.pathologyLabsService.getMine(userId);
    return this.prisma.hospitalLabLink.findMany({
      where: { labId: lab.id },
      include: {
        hospitalTenant: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findLinkOwnedByLab(id: string, userId: string) {
    const lab = await this.pathologyLabsService.getMine(userId);
    const link = await this.prisma.hospitalLabLink.findUnique({
      where: { id },
    });
    if (!link) throw new NotFoundException('Link request not found');
    if (link.labId !== lab.id) {
      throw new ForbiddenException('This link does not belong to your lab');
    }
    return link;
  }

  async approve(id: string, userId: string) {
    const link = await this.findLinkOwnedByLab(id, userId);
    if (link.status !== LabLinkStatus.PENDING) {
      throw new BadRequestException(
        `Link is already ${link.status.toLowerCase()}`,
      );
    }
    return this.prisma.hospitalLabLink.update({
      where: { id },
      data: {
        status: LabLinkStatus.ACTIVE,
        respondedById: userId,
        respondedAt: new Date(),
      },
    });
  }

  async reject(id: string, userId: string) {
    const link = await this.findLinkOwnedByLab(id, userId);
    if (link.status !== LabLinkStatus.PENDING) {
      throw new BadRequestException(
        `Link is already ${link.status.toLowerCase()}`,
      );
    }
    return this.prisma.hospitalLabLink.update({
      where: { id },
      data: {
        status: LabLinkStatus.REJECTED,
        respondedById: userId,
        respondedAt: new Date(),
      },
    });
  }

  async revoke(
    id: string,
    user: { id: string; tenantId: string; role: string },
  ) {
    const link = await this.prisma.hospitalLabLink.findUnique({
      where: { id },
    });
    if (!link) throw new NotFoundException('Link request not found');

    if (user.role === 'PATHOLOGY') {
      const lab = await this.pathologyLabsService.getMine(user.id);
      if (link.labId !== lab.id) {
        throw new ForbiddenException('This link does not belong to your lab');
      }
    } else if (link.hospitalTenantId !== user.tenantId) {
      throw new ForbiddenException(
        'This link does not belong to your hospital',
      );
    }

    if (link.status !== LabLinkStatus.ACTIVE) {
      throw new BadRequestException('Only an active link can be revoked');
    }

    return this.prisma.hospitalLabLink.update({
      where: { id },
      data: {
        status: LabLinkStatus.REVOKED,
        respondedById: user.id,
        respondedAt: new Date(),
      },
    });
  }

  /** Used by pathology-orders to gate hospital-side order placement. */
  async assertActiveLink(hospitalTenantId: string, labId: string) {
    const link = await this.prisma.hospitalLabLink.findUnique({
      where: { hospitalTenantId_labId: { hospitalTenantId, labId } },
    });
    if (!link || link.status !== LabLinkStatus.ACTIVE) {
      throw new ForbiddenException(
        'Your hospital is not actively linked with this lab',
      );
    }
    return link;
  }
}
