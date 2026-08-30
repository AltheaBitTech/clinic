import 'dotenv/config';
import { PrismaClient, SubscriptionPlan, BillingCycle } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const planSeeds: {
  tier: SubscriptionPlan;
  name: string;
  priceInPaise: number;
  features: string[];
  maxDoctors: number | null;
  maxPatients: number | null;
}[] = [
  {
    tier: SubscriptionPlan.FREE,
    name: 'Free',
    priceInPaise: 0,
    features: ['Up to 2 doctors', 'Up to 50 patients', 'Basic appointment scheduling'],
    maxDoctors: 2,
    maxPatients: 50,
  },
  {
    tier: SubscriptionPlan.BASIC,
    name: 'Basic (Monthly)',
    priceInPaise: 99900,
    features: ['Up to 10 doctors', 'Unlimited patients', 'SMS & email reminders'],
    maxDoctors: 10,
    maxPatients: null,
  },
  {
    tier: SubscriptionPlan.PROFESSIONAL,
    name: 'Professional (Monthly)',
    priceInPaise: 249900,
    features: ['Unlimited doctors & patients', 'WhatsApp reminders', 'Pharmacy module'],
    maxDoctors: null,
    maxPatients: null,
  },
  {
    tier: SubscriptionPlan.ENTERPRISE,
    name: 'Enterprise (Monthly)',
    priceInPaise: 499900,
    features: ['Everything in Professional', 'Priority support', 'Custom onboarding'],
    maxDoctors: null,
    maxPatients: null,
  },
];

async function main() {
  console.log('Seeding subscription plans only (no tenants/users touched)...');
  for (const p of planSeeds) {
    const plan = await prisma.plan.upsert({
      where: { tier_billingCycle: { tier: p.tier, billingCycle: BillingCycle.MONTHLY } },
      update: {},
      create: {
        tier: p.tier,
        billingCycle: BillingCycle.MONTHLY,
        name: p.name,
        priceInPaise: p.priceInPaise,
        features: p.features,
        maxDoctors: p.maxDoctors,
        maxPatients: p.maxPatients,
      },
    });
    console.log(`  - ${plan.tier} / ${plan.billingCycle}: ${plan.name}`);
  }
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error('Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
