# Arogyix — Hospital Management SaaS Platform

A full-stack, multi-tenant hospital management platform built with **NestJS + Prisma** (backend) and **Next.js 14** (frontend).

---

## 🏗 Architecture

```
/Clinic
  ├── backend/    NestJS + Prisma + PostgreSQL
  └── frontend/   Next.js 14 App Router
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (local or hosted)

### 1. Backend Setup

```bash
cd backend

# Copy env
cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL connection string

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed subscription plans + demo data (safe to re-run — upserts only)
npx prisma db seed

# Start dev server
npm run start:dev
```

**Backend runs at:** `http://localhost:3001/api/v1`
**Swagger Docs:** `http://localhost:3001/api/docs`

### 2. Frontend Setup

```bash
cd frontend

# Already has .env.local configured
# Start dev server
npm run dev
```

**Frontend runs at:** `http://localhost:3000`

---

## 👥 User Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Platform owner — manages all hospitals, billing, subscriptions |
| `HOSPITAL_ADMIN` | Hospital owner — manages doctors, staff, patients |
| `DOCTOR` | Creates appointments, prescriptions, views patient history |
| `RECEPTIONIST` | Registers patients, books appointments, collects payments |
| `PATIENT` | Views prescriptions, medicines, reports, books appointments |

---

## 🔑 Seeded Accounts (for testing & development)

All roles log in through the main login portal at: `http://localhost:3000/login`

| Role | Dashboard Redirect | Email | Password |
|---|---|---|---|
| **Super Admin** | `/dashboard/super-admin` | `superadmin@Arogyix.health` | `Password123!` |
| **Hospital Admin** | `/dashboard/hospital` | `admin@Arogyix.health` | `Password123!` |
| **Doctor** | `/dashboard/doctor` | `doctor@Arogyix.health` | `Password123!` |
| **Receptionist** | `/dashboard/receptionist` | `receptionist@Arogyix.health` | `Password123!` |
| **Patient** | `/dashboard/patient` | `patient@Arogyix.health` | `Password123!` |

---


## 📦 Backend Modules

| Module | Endpoints |
|---|---|
| `auth` | Register, Login, OTP, Refresh, Invite |
| `tenants` | Hospital CRUD, invites |
| `users` | User management |
| `doctors` | Doctor profiles, available slots |
| `departments` | Department CRUD |
| `patients` | Patient registration, family members, history |
| `appointments` | Create, update, today's schedule, missed follow-ups |
| `prescriptions` | Write prescriptions, auto-generate PDFs, schedule reminders |
| `reports` | Upload/download medical reports |
| `notifications` | Notification center |
| `chat` | Real-time Socket.io chat |
| `dashboard` | Role-based analytics |
| `billing` | Invoices and payments |
| `reminders` | Cron-based medicine & appointment reminders |

---

## 🖥 Frontend Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Email + password login |
| `/register` | Account registration |
| `/dashboard` | Role-based redirect |
| `/dashboard/hospital` | Hospital Admin dashboard |
| `/dashboard/doctor` | Doctor dashboard |
| `/dashboard/patient` | Patient portal |
| `/dashboard/patients` | Patient list + search |
| `/dashboard/appointments` | Appointment management |
| `/dashboard/prescriptions` | Digital prescriptions |
| `/dashboard/reports` | Report repository |
| `/dashboard/notifications` | Notification center |

---

## 🔧 Environment Variables

### Backend (`.env`)
```
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
SMTP_HOST="smtp.gmail.com"
TWILIO_ACCOUNT_SID="..."
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## 🏥 Multi-Tenant Architecture

Every hospital is a fully isolated tenant:
- All records have `tenantId`
- Doctors, patients, appointments scoped per hospital
- JWT contains `tenantId` + `role` for RBAC
- Guards automatically filter by tenant

---

## ⚡ Key Features

- **Digital Prescriptions** — PDF auto-generated with PDFKit
- **Medicine Reminders** — Cron job every 15 min (push/SMS/WhatsApp stubs)
- **Appointment Flow** — Create → Notify → Remind → Complete → Follow-up
- **Patient Timeline** — Chronological event log per patient
- **Real-time Chat** — Socket.io gateway between doctor ↔ patient
- **RBAC** — 5 roles with NestJS Guards + decorators

---

## 📸 Tech Stack

**Backend:** NestJS · Prisma · PostgreSQL · JWT · Socket.io · PDFKit · Nodemailer · Twilio · `@nestjs/schedule`

**Frontend:** Next.js 14 · TailwindCSS · React Query · React Hook Form · Zod · Lucide Icons · Recharts · Socket.io Client
