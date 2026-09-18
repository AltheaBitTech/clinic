import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class LabCommissionService {
  /**
   * Commission is captured on the order at creation time from the
   * percent in effect then, so later rate changes never retroactively
   * alter an already-placed order — mirrors ReferralCommission's approach.
   */
  compute(
    orderTotal: Prisma.Decimal | number,
    commissionPercent: Prisma.Decimal | number | null | undefined,
  ): number | null {
    if (commissionPercent === null || commissionPercent === undefined) {
      return null;
    }
    const total = Number(orderTotal);
    const percent = Number(commissionPercent);
    return Math.round(total * (percent / 100) * 100) / 100;
  }
}
