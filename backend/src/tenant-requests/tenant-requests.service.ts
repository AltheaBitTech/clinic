import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantRequestDto } from './dto/create-tenant-request.dto';
import { RequestStatus, TenantType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TenantRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantRequestDto) {
    const type = dto.type ?? TenantType.HOSPITAL;

    if (type === TenantType.PHARMACY && (!dto.phone || !dto.address)) {
      throw new BadRequestException(
        'Phone and address are required for pharmacy registration requests',
      );
    }

    // Check if email is already a registered user
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered as a user');
    }

    // Check if a pending request already exists for this email
    const existingRequest = await this.prisma.tenantRequest.findFirst({
      where: { email: dto.email, status: RequestStatus.PENDING },
    });
    if (existingRequest) {
      throw new ConflictException(
        'A registration request for this email is already pending',
      );
    }

    return this.prisma.tenantRequest.create({
      data: {
        type,
        name: dto.name,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
      },
    });
  }

  async findAll() {
    return this.prisma.tenantRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({
      where: { id },
    });
    console.log(`Found tenant request: ${JSON.stringify(request)}`);
    if (!request) {
      throw new NotFoundException('Registration request not found');
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Request has already been ${request.status.toLowerCase()}`,
      );
    }

    // Generate unique slug for tenant
    let slug = request.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingTenant) {
      // Append a short unique random suffix to the slug if it already exists
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const tempPassword = 'Welcome@Arogyix2026';
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const { tenant, user } =
      request.type === TenantType.PHARMACY
        ? await this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
              data: {
                type: TenantType.PHARMACY,
                name: request.name,
                slug,
                email: request.email,
                phone: request.phone,
                address: request.address,
                city: request.city,
                state: request.state,
              },
            });

            const user = await tx.user.create({
              data: {
                tenantId: tenant.id,
                email: request.email,
                phone: request.phone || null,
                firstName: request.firstName,
                lastName: request.lastName,
                passwordHash,
                role: UserRole.PHARMACY,
                isVerified: true,
              },
            });

            await tx.pharmacy.create({
              data: {
                tenantId: tenant.id,
                userId: user.id,
                name: request.name,
                phone: request.phone as string,
                address: request.address as string,
                city: request.city,
                state: request.state,
              },
            });

            return { tenant, user };
          })
        : await (async () => {
            // Create the Tenant
            const tenant = await this.prisma.tenant.create({
              data: {
                name: request.name,
                slug,
                email: request.email,
                phone: request.phone,
                address: request.address,
                city: request.city,
                state: request.state,
              },
            });

            // Create the HOSPITAL_ADMIN User
            const user = await this.prisma.user.create({
              data: {
                tenantId: tenant.id,
                email: request.email,
                phone: request.phone || null,
                firstName: request.firstName,
                lastName: request.lastName,
                passwordHash,
                role: UserRole.HOSPITAL_ADMIN,
                isVerified: true,
              },
            });

            return { tenant, user };
          })();

    // Update Request status to APPROVED
    await this.prisma.tenantRequest.update({
      where: { id },
      data: { status: RequestStatus.APPROVED },
    });

    return {
      message: 'Registration request approved successfully',
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      adminEmail: user.email,
      temporaryPassword: tempPassword,
    };
  }

  async reject(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('Registration request not found');
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Request has already been ${request.status.toLowerCase()}`,
      );
    }

    return this.prisma.tenantRequest.update({
      where: { id },
      data: { status: RequestStatus.REJECTED },
    });
  }
}
