import { Injectable } from '@nestjs/common';
import { BillingCycle, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PAYING_STATUSES: SubscriptionStatus[] = ['ACTIVE', 'COMPLETED'];

export function monthlyEquivalentPaise(
  priceInPaise: number,
  billingCycle: BillingCycle,
): number {
  return billingCycle === 'YEARLY'
    ? Math.round(priceInPaise / 12)
    : priceInPaise;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getRevenueOverview() {
    const subscriptions = await this.prisma.subscription.findMany({
      include: { plan: true },
    });

    const active = subscriptions.filter((s) => s.status === 'ACTIVE');
    const currentMrrInPaise = active.reduce(
      (sum, s) =>
        sum + monthlyEquivalentPaise(s.plan.priceInPaise, s.plan.billingCycle),
      0,
    );

    const planMixMap = new Map<
      string,
      { tenantCount: number; mrrInPaise: number }
    >();
    for (const s of active) {
      const tier = s.plan.tier;
      const entry = planMixMap.get(tier) ?? { tenantCount: 0, mrrInPaise: 0 };
      entry.tenantCount += 1;
      entry.mrrInPaise += monthlyEquivalentPaise(
        s.plan.priceInPaise,
        s.plan.billingCycle,
      );
      planMixMap.set(tier, entry);
    }
    const planMix = Array.from(planMixMap.entries()).map(([tier, v]) => ({
      tier,
      ...v,
    }));

    const statusGroups = await this.prisma.subscription.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const statusBreakdown = statusGroups.map((g) => ({
      status: g.status,
      count: g._count.status,
    }));

    const now = new Date();
    const monthlyTrend: {
      month: string;
      newOrRenewedMrrInPaise: number;
      count: number;
    }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyTrend.push({
        month: monthKey(d),
        newOrRenewedMrrInPaise: 0,
        count: 0,
      });
    }
    const bucketIndex = new Map(
      monthlyTrend.map((bucket, idx) => [bucket.month, idx]),
    );

    for (const s of subscriptions) {
      if (!s.currentPeriodStart || !PAYING_STATUSES.includes(s.status))
        continue;
      const idx = bucketIndex.get(monthKey(s.currentPeriodStart));
      if (idx === undefined) continue;
      monthlyTrend[idx].newOrRenewedMrrInPaise += monthlyEquivalentPaise(
        s.plan.priceInPaise,
        s.plan.billingCycle,
      );
      monthlyTrend[idx].count += 1;
    }

    return {
      currency: 'INR',
      currentMrrInPaise,
      activeSubscriptions: active.length,
      planMix,
      statusBreakdown,
      monthlyTrend,
    };
  }
}
