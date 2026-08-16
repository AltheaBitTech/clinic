import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Tx = Prisma.TransactionClient;

@Injectable()
export class PharmacyAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    pharmacyId: string,
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    beforeData?: unknown,
    afterData?: unknown,
    tx?: Tx,
  ) {
    const client = tx ?? this.prisma;
    return client.auditLog.create({
      data: {
        pharmacyId,
        userId,
        action,
        entity,
        entityId,
        beforeData: beforeData === undefined ? undefined : (beforeData as any),
        afterData: afterData === undefined ? undefined : (afterData as any),
      },
    });
  }
}
