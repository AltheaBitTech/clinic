import {
  PrismaClient,
  UserRole,
  SubscriptionPlan,
  BillingCycle,
  Gender,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed process...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 1. Create Tenant
  console.log('Creating Tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'Arogyix-clinic' },
    update: {},
    create: {
      name: 'Arogyix Clinic',
      slug: 'Arogyix-clinic',
      email: 'contact@Arogyix.health',
      phone: '+1234567890',
      address: '123 Health Ave',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      subscriptionPlan: SubscriptionPlan.FREE,
      isActive: true,
    },
  });
  console.log(`Tenant created: ${tenant.name} (${tenant.id})`);

  // 1b. Create Subscription Plans. razorpayPlanId is null until the matching
  // Plan objects are created in the Razorpay Dashboard (Test Mode) and pasted
  // in here — paid checkout will 503 with a clear error until that's done,
  // but everything else (browsing plans, FREE-tier checkout) works without it.
  console.log('Creating Subscription Plans...');
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
      features: [
        'Up to 2 doctors',
        'Up to 50 patients',
        'Basic appointment scheduling',
      ],
      maxDoctors: 2,
      maxPatients: 50,
    },
    {
      tier: SubscriptionPlan.BASIC,
      name: 'Basic (Monthly)',
      priceInPaise: 99900,
      features: [
        'Up to 10 doctors',
        'Unlimited patients',
        'SMS & email reminders',
      ],
      maxDoctors: 10,
      maxPatients: null,
    },
    {
      tier: SubscriptionPlan.PROFESSIONAL,
      name: 'Professional (Monthly)',
      priceInPaise: 249900,
      features: [
        'Unlimited doctors & patients',
        'WhatsApp reminders',
        'Pharmacy module',
      ],
      maxDoctors: null,
      maxPatients: null,
    },
    {
      tier: SubscriptionPlan.ENTERPRISE,
      name: 'Enterprise (Monthly)',
      priceInPaise: 499900,
      features: [
        'Everything in Professional',
        'Priority support',
        'Custom onboarding',
      ],
      maxDoctors: null,
      maxPatients: null,
    },
  ];
  for (const p of planSeeds) {
    await prisma.plan.upsert({
      where: {
        tier_billingCycle: { tier: p.tier, billingCycle: BillingCycle.MONTHLY },
      },
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
  }
  console.log('Subscription Plans created.');

  // 2. Create Super Admin (No tenantId)
  console.log('Creating Super Admin...');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@Arogyix.health' },
    update: { passwordHash },
    create: {
      email: 'superadmin@Arogyix.health',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`Super Admin created: ${superAdmin.email}`);

  // 3. Create Hospital Admin
  console.log('Creating Hospital Admin...');
  const hospitalAdmin = await prisma.user.upsert({
    where: { email: 'admin@Arogyix.health' },
    update: { passwordHash, tenantId: tenant.id },
    create: {
      email: 'admin@Arogyix.health',
      passwordHash,
      firstName: 'Clinic',
      lastName: 'Admin',
      role: UserRole.HOSPITAL_ADMIN,
      isActive: true,
      isVerified: true,
      tenantId: tenant.id,
    },
  });
  console.log(`Hospital Admin created: ${hospitalAdmin.email}`);

  // 4. Create Doctor
  console.log('Creating Doctor User...');
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@Arogyix.health' },
    update: { passwordHash, tenantId: tenant.id },
    create: {
      email: 'doctor@Arogyix.health',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.DOCTOR,
      isActive: true,
      isVerified: true,
      tenantId: tenant.id,
    },
  });

  console.log('Creating Doctor Profile...');
  await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: { tenantId: tenant.id },
    create: {
      userId: doctorUser.id,
      tenantId: tenant.id,
      specialization: 'Cardiology',
      qualification: 'MD, DM',
      registrationNo: 'MC-12345',
      experienceYears: 10,
      consultationFee: 500,
      bio: 'Experienced cardiologist specializing in interventional cardiology.',
    },
  });
  console.log(`Doctor created: ${doctorUser.email}`);

  // 5. Create Receptionist
  console.log('Creating Receptionist...');
  const receptionist = await prisma.user.upsert({
    where: { email: 'receptionist@Arogyix.health' },
    update: { passwordHash, tenantId: tenant.id },
    create: {
      email: 'receptionist@Arogyix.health',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.RECEPTIONIST,
      isActive: true,
      isVerified: true,
      tenantId: tenant.id,
    },
  });
  console.log(`Receptionist created: ${receptionist.email}`);

  // 6. Create Patient
  console.log('Creating Patient User...');
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@Arogyix.health' },
    update: { passwordHash, tenantId: tenant.id },
    create: {
      email: 'patient@Arogyix.health',
      passwordHash,
      firstName: 'Robert',
      lastName: 'Johnson',
      role: UserRole.PATIENT,
      isActive: true,
      isVerified: true,
      tenantId: tenant.id,
    },
  });

  console.log('Creating Patient Profile...');
  // patientCode is derived from patientUser.id (not a hardcoded literal) so it
  // can never collide with a patientCode already used by an unrelated
  // tenant/user's Patient row — patientCode is globally unique, not scoped.
  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: { tenantId: tenant.id },
    create: {
      userId: patientUser.id,
      tenantId: tenant.id,
      patientCode: `PAT-${patientUser.id.slice(-8).toUpperCase()}`,
      bloodGroup: 'O+',
      gender: Gender.MALE,
      address: '456 Patient St',
      city: 'Mumbai',
    },
  });
  console.log(`Patient created: ${patientUser.email}`);

  // 7. Seed shared Pathology Master Test catalog — platform-curated reference
  // data every lab can search/import from (see PathologyMasterTest model).
  console.log('Seeding Pathology Master Test catalog...');
  const masterTests: {
    code: string;
    name: string;
    category: string;
    department: string;
    sampleType: string;
    fastingRequired?: boolean;
  }[] = [
    // Hematology
    {
      code: 'CBC',
      name: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      department: 'Hematology',
      sampleType: 'BLOOD',
    },
    {
      code: 'ESR',
      name: 'Erythrocyte Sedimentation Rate (ESR)',
      category: 'Hematology',
      department: 'Hematology',
      sampleType: 'BLOOD',
    },
    {
      code: 'PS',
      name: 'Peripheral Smear Examination',
      category: 'Hematology',
      department: 'Hematology',
      sampleType: 'BLOOD',
    },
    {
      code: 'RETIC',
      name: 'Reticulocyte Count',
      category: 'Hematology',
      department: 'Hematology',
      sampleType: 'BLOOD',
    },
    {
      code: 'PT-INR',
      name: 'Prothrombin Time / INR',
      category: 'Hematology',
      department: 'Hematology',
      sampleType: 'BLOOD',
    },
    {
      code: 'APTT',
      name: 'Activated Partial Thromboplastin Time (APTT)',
      category: 'Hematology',
      department: 'Hematology',
      sampleType: 'BLOOD',
    },
    {
      code: 'BT-CT',
      name: 'Bleeding Time & Clotting Time',
      category: 'Hematology',
      department: 'Hematology',
      sampleType: 'BLOOD',
    },
    {
      code: 'D-DIMER',
      name: 'D-Dimer',
      category: 'Hematology',
      department: 'Hematology',
      sampleType: 'BLOOD',
    },
    // Biochemistry
    {
      code: 'LFT',
      name: 'Liver Function Test (LFT)',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'KFT',
      name: 'Kidney Function Test (KFT)',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'LIPID',
      name: 'Lipid Profile',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
      fastingRequired: true,
    },
    {
      code: 'FBS',
      name: 'Fasting Blood Sugar (FBS)',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
      fastingRequired: true,
    },
    {
      code: 'PPBS',
      name: 'Post-Prandial Blood Sugar (PPBS)',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'RBS',
      name: 'Random Blood Sugar (RBS)',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'HBA1C',
      name: 'HbA1c (Glycated Hemoglobin)',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'ELEC',
      name: 'Serum Electrolytes (Na/K/Cl)',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'CALCIUM',
      name: 'Serum Calcium',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'URICACID',
      name: 'Serum Uric Acid',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'AMYLASE',
      name: 'Serum Amylase',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'LIPASE',
      name: 'Serum Lipase',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'CPK',
      name: 'CPK - Total',
      category: 'Biochemistry',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    // Endocrinology
    {
      code: 'TFT',
      name: 'Thyroid Profile (T3, T4, TSH)',
      category: 'Endocrinology',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'VITD',
      name: 'Vitamin D (25-OH)',
      category: 'Endocrinology',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'VITB12',
      name: 'Vitamin B12',
      category: 'Endocrinology',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'IRON',
      name: 'Iron Studies (Iron/TIBC/Ferritin)',
      category: 'Endocrinology',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'INSULIN',
      name: 'Fasting Insulin',
      category: 'Endocrinology',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
      fastingRequired: true,
    },
    // Serology / Immunology
    {
      code: 'WIDAL',
      name: 'Widal Test',
      category: 'Serology',
      department: 'Microbiology',
      sampleType: 'BLOOD',
    },
    {
      code: 'DENGUE-NS1',
      name: 'Dengue NS1 Antigen',
      category: 'Serology',
      department: 'Microbiology',
      sampleType: 'BLOOD',
    },
    {
      code: 'DENGUE-IGM',
      name: 'Dengue IgM',
      category: 'Serology',
      department: 'Microbiology',
      sampleType: 'BLOOD',
    },
    {
      code: 'DENGUE-IGG',
      name: 'Dengue IgG',
      category: 'Serology',
      department: 'Microbiology',
      sampleType: 'BLOOD',
    },
    {
      code: 'MALARIA',
      name: 'Malaria Antigen (MP Smear)',
      category: 'Serology',
      department: 'Microbiology',
      sampleType: 'BLOOD',
    },
    {
      code: 'HIV',
      name: 'HIV I & II (Rapid)',
      category: 'Serology',
      department: 'Microbiology',
      sampleType: 'BLOOD',
    },
    {
      code: 'HBSAG',
      name: 'HBsAg (Hepatitis B)',
      category: 'Serology',
      department: 'Microbiology',
      sampleType: 'BLOOD',
    },
    {
      code: 'HCV',
      name: 'Anti-HCV',
      category: 'Serology',
      department: 'Microbiology',
      sampleType: 'BLOOD',
    },
    {
      code: 'VDRL',
      name: 'VDRL / RPR',
      category: 'Serology',
      department: 'Microbiology',
      sampleType: 'BLOOD',
    },
    {
      code: 'CRP',
      name: 'C-Reactive Protein (CRP)',
      category: 'Serology',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'RAFACTOR',
      name: 'RA Factor',
      category: 'Serology',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'ASO',
      name: 'ASO Titre',
      category: 'Serology',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'TYPHIDOT',
      name: 'Typhidot (IgM)',
      category: 'Serology',
      department: 'Microbiology',
      sampleType: 'BLOOD',
    },
    // Urine / Stool
    {
      code: 'URINE-RM',
      name: 'Urine Routine & Microscopy',
      category: 'Clinical Pathology',
      department: 'Clinical Pathology',
      sampleType: 'URINE',
    },
    {
      code: 'URINE-CS',
      name: 'Urine Culture & Sensitivity',
      category: 'Microbiology',
      department: 'Microbiology',
      sampleType: 'URINE',
    },
    {
      code: 'UPT',
      name: 'Urine Pregnancy Test (UPT)',
      category: 'Clinical Pathology',
      department: 'Clinical Pathology',
      sampleType: 'URINE',
    },
    {
      code: 'MICROALB',
      name: 'Microalbumin (Urine)',
      category: 'Clinical Pathology',
      department: 'Biochemistry',
      sampleType: 'URINE',
    },
    {
      code: 'STOOL-RM',
      name: 'Stool Routine & Microscopy',
      category: 'Clinical Pathology',
      department: 'Clinical Pathology',
      sampleType: 'STOOL',
    },
    {
      code: 'STOOL-OB',
      name: 'Stool Occult Blood',
      category: 'Clinical Pathology',
      department: 'Clinical Pathology',
      sampleType: 'STOOL',
    },
    // Cardiac / Oncology / Other
    {
      code: 'TROPONIN',
      name: 'Troponin I',
      category: 'Cardiac Markers',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'PSA',
      name: 'PSA (Total)',
      category: 'Oncology',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'BHCG',
      name: 'Beta-hCG (Serum)',
      category: 'Endocrinology',
      department: 'Biochemistry',
      sampleType: 'BLOOD',
    },
    {
      code: 'COVID-RTPCR',
      name: 'COVID-19 RT-PCR',
      category: 'Microbiology',
      department: 'Microbiology',
      sampleType: 'SWAB',
    },
  ];

  for (const t of masterTests) {
    await prisma.pathologyMasterTest.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        category: t.category,
        department: t.department,
        sampleType: t.sampleType,
        fastingRequired: t.fastingRequired ?? false,
      },
      create: {
        code: t.code,
        name: t.name,
        category: t.category,
        department: t.department,
        sampleType: t.sampleType,
        fastingRequired: t.fastingRequired ?? false,
      },
    });
  }

  // Flagship reference-range parameters for the five most commonly ordered
  // panels — kept idempotent by replacing the parameter set on every run.
  const flagshipParams: Record<
    string,
    {
      name: string;
      unit?: string;
      refRangeLow?: number;
      refRangeHigh?: number;
      refRangeText?: string;
    }[]
  > = {
    CBC: [
      { name: 'Hemoglobin', unit: 'g/dL', refRangeLow: 13, refRangeHigh: 17 },
      {
        name: 'Total WBC Count',
        unit: '/µL',
        refRangeLow: 4000,
        refRangeHigh: 11000,
      },
      {
        name: 'RBC Count',
        unit: 'mill/µL',
        refRangeLow: 4.5,
        refRangeHigh: 5.5,
      },
      {
        name: 'Platelet Count',
        unit: '/µL',
        refRangeLow: 150000,
        refRangeHigh: 450000,
      },
      {
        name: 'PCV (Hematocrit)',
        unit: '%',
        refRangeLow: 40,
        refRangeHigh: 50,
      },
      { name: 'MCV', unit: 'fL', refRangeLow: 83, refRangeHigh: 101 },
      { name: 'MCH', unit: 'pg', refRangeLow: 27, refRangeHigh: 32 },
      { name: 'MCHC', unit: 'g/dL', refRangeLow: 31.5, refRangeHigh: 34.5 },
      { name: 'Neutrophils', unit: '%', refRangeLow: 40, refRangeHigh: 80 },
      { name: 'Lymphocytes', unit: '%', refRangeLow: 20, refRangeHigh: 40 },
    ],
    LFT: [
      {
        name: 'Total Bilirubin',
        unit: 'mg/dL',
        refRangeLow: 0.2,
        refRangeHigh: 1.2,
      },
      {
        name: 'Direct Bilirubin',
        unit: 'mg/dL',
        refRangeLow: 0,
        refRangeHigh: 0.3,
      },
      { name: 'SGOT (AST)', unit: 'U/L', refRangeLow: 5, refRangeHigh: 40 },
      { name: 'SGPT (ALT)', unit: 'U/L', refRangeLow: 7, refRangeHigh: 56 },
      {
        name: 'Alkaline Phosphatase',
        unit: 'U/L',
        refRangeLow: 44,
        refRangeHigh: 147,
      },
      {
        name: 'Total Protein',
        unit: 'g/dL',
        refRangeLow: 6.4,
        refRangeHigh: 8.3,
      },
      { name: 'Albumin', unit: 'g/dL', refRangeLow: 3.5, refRangeHigh: 5.0 },
      { name: 'GGT', unit: 'U/L', refRangeLow: 8, refRangeHigh: 61 },
    ],
    KFT: [
      { name: 'Blood Urea', unit: 'mg/dL', refRangeLow: 15, refRangeHigh: 40 },
      {
        name: 'Serum Creatinine',
        unit: 'mg/dL',
        refRangeLow: 0.6,
        refRangeHigh: 1.3,
      },
      { name: 'Uric Acid', unit: 'mg/dL', refRangeLow: 3.5, refRangeHigh: 7.2 },
      { name: 'Sodium', unit: 'mEq/L', refRangeLow: 135, refRangeHigh: 145 },
      { name: 'Potassium', unit: 'mEq/L', refRangeLow: 3.5, refRangeHigh: 5.1 },
      { name: 'Chloride', unit: 'mEq/L', refRangeLow: 98, refRangeHigh: 107 },
    ],
    LIPID: [
      {
        name: 'Total Cholesterol',
        unit: 'mg/dL',
        refRangeText: 'Desirable < 200',
      },
      { name: 'Triglycerides', unit: 'mg/dL', refRangeText: 'Normal < 150' },
      { name: 'HDL Cholesterol', unit: 'mg/dL', refRangeText: 'Low if < 40' },
      { name: 'LDL Cholesterol', unit: 'mg/dL', refRangeText: 'Optimal < 100' },
      { name: 'VLDL', unit: 'mg/dL', refRangeLow: 5, refRangeHigh: 40 },
    ],
    TFT: [
      { name: 'T3 Total', unit: 'ng/dL', refRangeLow: 80, refRangeHigh: 200 },
      { name: 'T4 Total', unit: 'µg/dL', refRangeLow: 5.1, refRangeHigh: 14.1 },
      { name: 'TSH', unit: 'µIU/mL', refRangeLow: 0.4, refRangeHigh: 4.0 },
    ],
  };

  for (const [code, params] of Object.entries(flagshipParams)) {
    const test = await prisma.pathologyMasterTest.findUniqueOrThrow({
      where: { code },
    });
    await prisma.pathologyMasterTestParameter.deleteMany({
      where: { masterTestId: test.id },
    });
    await prisma.pathologyMasterTestParameter.createMany({
      data: params.map((p, i) => ({
        ...p,
        masterTestId: test.id,
        displayOrder: i,
      })),
    });
  }
  console.log(
    `Pathology Master Test catalog seeded: ${masterTests.length} tests.`,
  );

  console.log('Seed process completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
