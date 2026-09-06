import {
  AnalyticsService,
  monthKey,
  monthlyEquivalentPaise,
} from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('monthlyEquivalentPaise', () => {
  it('returns the price as-is for a monthly plan', () => {
    expect(monthlyEquivalentPaise(99900, 'MONTHLY')).toBe(99900);
  });

  it('divides the price by 12 for a yearly plan', () => {
    expect(monthlyEquivalentPaise(1200000, 'YEARLY')).toBe(100000);
  });

  it('rounds a non-evenly-divisible yearly price', () => {
    expect(monthlyEquivalentPaise(100000, 'YEARLY')).toBe(8333);
  });
});

describe('monthKey', () => {
  it('formats a date as YYYY-MM', () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe('2026-01');
    expect(monthKey(new Date(2025, 10, 1))).toBe('2025-11');
  });
});

describe('AnalyticsService', () => {
  let prisma: {
    subscription: { findMany: jest.Mock; groupBy: jest.Mock };
  };
  let service: AnalyticsService;

  beforeEach(() => {
    prisma = {
      subscription: { findMany: jest.fn(), groupBy: jest.fn() },
    };
    service = new AnalyticsService(prisma as unknown as PrismaService);
  });

  it('computes current MRR, plan mix, status breakdown and monthly trend', async () => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    prisma.subscription.findMany.mockResolvedValue([
      {
        status: 'ACTIVE',
        currentPeriodStart: thisMonthStart,
        plan: { tier: 'BASIC', priceInPaise: 99900, billingCycle: 'MONTHLY' },
      },
      {
        status: 'ACTIVE',
        currentPeriodStart: thisMonthStart,
        plan: {
          tier: 'PROFESSIONAL',
          priceInPaise: 1200000,
          billingCycle: 'YEARLY',
        },
      },
      {
        status: 'CANCELLED',
        currentPeriodStart: thisMonthStart,
        plan: { tier: 'BASIC', priceInPaise: 99900, billingCycle: 'MONTHLY' },
      },
    ]);
    prisma.subscription.groupBy.mockResolvedValue([
      { status: 'ACTIVE', _count: { status: 2 } },
      { status: 'CANCELLED', _count: { status: 1 } },
    ]);

    const result = await service.getRevenueOverview();

    expect(result.currentMrrInPaise).toBe(99900 + 100000);
    expect(result.activeSubscriptions).toBe(2);
    expect(result.planMix).toEqual(
      expect.arrayContaining([
        { tier: 'BASIC', tenantCount: 1, mrrInPaise: 99900 },
        { tier: 'PROFESSIONAL', tenantCount: 1, mrrInPaise: 100000 },
      ]),
    );
    expect(result.statusBreakdown).toEqual([
      { status: 'ACTIVE', count: 2 },
      { status: 'CANCELLED', count: 1 },
    ]);
    expect(result.monthlyTrend).toHaveLength(12);
    expect(result.monthlyTrend[11]).toEqual({
      month: monthKey(thisMonthStart),
      newOrRenewedMrrInPaise: 99900 + 100000,
      count: 2,
    });
  });
});
