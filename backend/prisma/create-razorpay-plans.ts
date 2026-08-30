import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import Razorpay from 'razorpay';

// One-off backfill: creates a Razorpay Plan for every DB `Plan` row that is
// missing `razorpayPlanId` (the FREE tier is intentionally skipped — it has
// no gateway plan) and writes the returned id back. Safe to re-run; rows
// that already have a razorpayPlanId are left untouched.
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

async function main() {
  const plans = await prisma.plan.findMany({
    where: { razorpayPlanId: null, tier: { not: 'FREE' } },
  });

  if (plans.length === 0) {
    console.log('No plans need a Razorpay plan created.');
    return;
  }

  for (const plan of plans) {
    const period = plan.billingCycle === 'YEARLY' ? 'yearly' : 'monthly';
    const created = await razorpay.plans.create({
      period,
      interval: 1,
      item: {
        name: plan.name,
        amount: plan.priceInPaise,
        currency: plan.currency,
      },
      notes: { planId: plan.id, tier: plan.tier },
    });

    await prisma.plan.update({
      where: { id: plan.id },
      data: { razorpayPlanId: created.id },
    });

    console.log(`  - ${plan.tier} / ${plan.billingCycle}: ${plan.name} -> ${created.id}`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error('Error creating Razorpay plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
