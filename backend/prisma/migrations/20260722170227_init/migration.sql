-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BLOOD_TEST', 'XRAY', 'MRI', 'CT_SCAN', 'ULTRASOUND', 'ECG', 'PRESCRIPTION', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('APPOINTMENT', 'PRESCRIPTION', 'MEDICINE_STARTED', 'REPORT_UPLOADED', 'FOLLOW_UP', 'REMINDER_SENT', 'NOTE_ADDED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'India',
    "logoUrl" TEXT,
    "website" TEXT,
    "licenseNumber" TEXT,
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "subscriptionEndsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "googleId" TEXT,
    "refreshToken" TEXT,
    "otp" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_invites" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT,
    "specialization" TEXT NOT NULL,
    "qualification" TEXT,
    "registrationNo" TEXT,
    "experienceYears" INTEGER,
    "consultationFee" DECIMAL(10,2),
    "bio" TEXT,
    "availableDays" TEXT[] DEFAULT ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']::TEXT[],
    "consultationStart" TEXT NOT NULL DEFAULT '09:00',
    "consultationEnd" TEXT NOT NULL DEFAULT '17:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientCode" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "bloodGroup" TEXT,
    "address" TEXT,
    "city" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "emergencyRelation" TEXT,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "chronicConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "bloodGroup" TEXT,
    "phone" TEXT,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "type" TEXT NOT NULL DEFAULT 'CONSULTATION',
    "reason" TEXT,
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "diagnosis" TEXT,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "timing" TEXT NOT NULL DEFAULT 'AFTER_FOOD',
    "instructions" TEXT,
    "reminderTimes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_reminders" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "labName" TEXT,
    "reportDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_timeline" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "eventType" "TimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "invoiceNo" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2),
    "tax" DECIMAL(10,2),
    "total" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_invites_token_key" ON "hospital_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_userId_key" ON "doctors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_userId_key" ON "patients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_patientCode_key" ON "patients"("patientCode");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_appointmentId_key" ON "invoices"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNo_key" ON "invoices"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_patientId_doctorId_key" ON "chat_rooms"("patientId", "doctorId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_invites" ADD CONSTRAINT "hospital_invites_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_reminders" ADD CONSTRAINT "medicine_reminders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_reminders" ADD CONSTRAINT "medicine_reminders_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_reminders" ADD CONSTRAINT "medicine_reminders_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_timeline" ADD CONSTRAINT "patient_timeline_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "chat_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
