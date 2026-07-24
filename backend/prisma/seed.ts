import { PrismaClient, UserRole, SubscriptionPlan, Gender } from '@prisma/client';
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
    where: { slug: 'caresync-clinic' },
    update: {},
    create: {
      name: 'CareSync Clinic',
      slug: 'caresync-clinic',
      email: 'contact@caresync.health',
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

  // 2. Create Super Admin (No tenantId)
  console.log('Creating Super Admin...');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@caresync.health' },
    update: { passwordHash },
    create: {
      email: 'superadmin@caresync.health',
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
    where: { email: 'admin@caresync.health' },
    update: { passwordHash, tenantId: tenant.id },
    create: {
      email: 'admin@caresync.health',
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
    where: { email: 'doctor@caresync.health' },
    update: { passwordHash, tenantId: tenant.id },
    create: {
      email: 'doctor@caresync.health',
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
    where: { email: 'receptionist@caresync.health' },
    update: { passwordHash, tenantId: tenant.id },
    create: {
      email: 'receptionist@caresync.health',
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
    where: { email: 'patient@caresync.health' },
    update: { passwordHash, tenantId: tenant.id },
    create: {
      email: 'patient@caresync.health',
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
  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: { tenantId: tenant.id },
    create: {
      userId: patientUser.id,
      tenantId: tenant.id,
      patientCode: 'PAT-1001',
      bloodGroup: 'O+',
      gender: Gender.MALE,
      address: '456 Patient St',
      city: 'Mumbai',
    },
  });
  console.log(`Patient created: ${patientUser.email}`);

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
