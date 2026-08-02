# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Arogyix — a multi-tenant hospital management SaaS. Monorepo with two independent apps that are not npm-workspaced (each has its own `node_modules`/lockfile):

```
/Clinic
  ├── backend/    NestJS 11 + Prisma 7 + PostgreSQL
  └── frontend/   Next.js 16 (App Router) + React 19
```

`README.md`, `APP_FLOW.md`, and `CLINIC_FLOW.md` at the repo root document the product-level user flows (registration, onboarding, appointment lifecycle, prescriptions, etc.) in more depth than this file.

## Commands

Run these from within `backend/` or `frontend/` respectively — there is no root-level script runner.

### Backend (`backend/`)
```bash
npx prisma generate         # regenerate Prisma client after any schema.prisma change
npx prisma db push           # sync schema to DATABASE_URL (no migration files)
npm run start:dev            # dev server w/ watch, http://localhost:3001/api/v1
npm run build                # nest build
npm run lint                 # eslint --fix over src,apps,libs,test
npm run format                # prettier --write src/**/*.ts test/**/*.ts
npm test                     # jest unit tests (*.spec.ts, colocated with source)
npm test -- patients.service  # run a single spec by name pattern
npm run test:e2e             # jest e2e (test/jest-e2e.json)
npm run test:cov
```
Swagger docs are served at `http://localhost:3001/api/docs`.

### Frontend (`frontend/`)
```bash
npm run dev     # next dev, http://localhost:3000
npm run build   # next build && opennextjs-cloudflare build (Cloudflare Workers output)
npm run start   # next start
```
There is no `npm test` in the frontend; there is no separate `lint` script wired into `package.json` (eslint config exists but isn't invoked via npm).

## Architecture

### Backend: tenant-scoped NestJS modules

Every feature is a self-contained Nest module under `src/<feature>/` with the standard `*.module.ts` / `*.controller.ts` / `*.service.ts` / `dto/*.dto.ts` layout, all wired into `AppModule` (`src/app.module.ts`). Modules: `auth`, `tenants`, `users`, `doctors`, `departments`, `patients`, `appointments`, `prescriptions`, `reports`, `notifications`, `chat`, `dashboard`, `billing`, `timeline`, `reminders`, `tenant-requests`, `medical-catalog`, `pharmacies`.

Auth/RBAC is applied **globally**, not per-controller:
- `AuthModule` registers `JwtAuthGuard` and `RolesGuard` as `APP_GUARD` providers (`src/auth/auth.module.ts`), so every route requires a valid JWT by default.
- Opt out of auth with `@Public()` (`src/auth/decorators/public.decorator.ts`) on login/register/webhook-style endpoints.
- Restrict by role with `@Roles(UserRole.HOSPITAL_ADMIN, ...)` (`src/auth/decorators/roles.decorator.ts`); `RolesGuard` allows the request through only if no `@Roles` metadata is present or the JWT user's role matches.
- `@CurrentUser()` pulls the validated user (id, role, tenantId, etc.) off the request — `JwtStrategy.validate()` re-fetches the user from the DB on every request and rejects if `isActive` is false.

**Multi-tenancy is manual, not middleware-enforced.** There is no global tenant-scoping interceptor or Prisma extension. Every query that should be tenant-scoped is scoped by hand: controllers pull `user.tenantId` from `@CurrentUser()` and pass it explicitly into the service method, which includes it in the Prisma `where` clause (see `src/patients/patients.controller.ts` + `patients.service.ts` for the canonical pattern). When adding a new endpoint or service method that touches tenant data, follow this same explicit-tenantId-parameter pattern — don't assume it's handled elsewhere.

Prisma uses the driver adapter API (`@prisma/adapter-pg`) rather than a bare connection string on the client (`src/prisma/prisma.service.ts`); `PrismaService` is a global singleton injected everywhere. Schema lives at `prisma/schema.prisma` (~580 lines) — key models: `Tenant`, `User` (has `UserRole`: `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`), `Doctor`, `Patient`, `Appointment`, `Prescription`, `Report`, `Invoice`, `TimelineEvent`, `Message`/chat rooms, `MedicalCatalogItem`, `Pharmacy`. There's no separate migrations workflow in active use — schema changes go through `prisma db push` (a `prisma/migrations/` dir exists but isn't the primary flow reflected in `README.md`).

`ScheduleModule` (`@nestjs/schedule`) powers `reminders` — cron-based medicine/appointment reminder dispatch. PDF prescriptions are generated with PDFKit; email via Nodemailer; SMS/WhatsApp via Twilio; realtime chat via a Socket.io gateway in `chat/`.

Global config in `main.ts`: prefix `api/v1`, CORS locked to `FRONTEND_URL`, a global `ValidationPipe` with `whitelist`/`forbidNonWhitelisted`/`transform` (DTOs are strict — undeclared body fields are rejected, not silently dropped), and static `/uploads` serving.

### Frontend: App Router, role-based dashboards

Routes under `app/dashboard/<role-or-feature>/` mirror the five roles (`super-admin`, `hospital`, `doctor`, `receptionist`/patient dashboards) plus shared feature pages (`appointments`, `patients`, `prescriptions`, `billing`, `reports`, `notifications`, `departments`, `doctors`, `pharmacies`, `medicines`, `staff`, `settings`, `analytics`).

- `lib/api.ts` — single Axios instance (`lib/api.ts`) with a request interceptor that attaches `accessToken` from `localStorage`, and a response interceptor that transparently refreshes on 401 via `/auth/refresh`, retries once, then hard-redirects to `/login` on failure. All backend calls go through the exported `*Api` namespace objects here (`authApi`, `patientsApi`, `appointmentsApi`, etc.) rather than calling `axios`/`api` directly from components — add new endpoints here rather than inlining fetch calls.
- `lib/auth.tsx` — `AuthProvider`/`useAuth()` context; owns login/register/logout, persists tokens to `localStorage`, and redirects post-auth by role (`redirectByRole`) to the matching `/dashboard/*` route. Any new role-aware redirect logic belongs here, matching backend `UserRole` values.
- `components/providers/QueryProvider.tsx` wraps the app in TanStack Query; data fetching in dashboard pages goes through React Query hooks over the `lib/api.ts` helpers.
- UI primitives are Radix + `class-variance-authority`/`tailwind-merge` (shadcn-style), Tailwind v4 (`postcss.config.mjs`, no `tailwind.config` — v4 CSS-first config), forms via `react-hook-form` + `zod` + `@hookform/resolvers`.

**Deployment target is Cloudflare Workers, not Vercel/Node.** `npm run build` runs `next build` then `@opennextjs/cloudflare build`; `wrangler.jsonc` points at `.open-next/worker.js` with `nodejs_compat`. `frontend/.open-next/` and `frontend/.wrangler/` are build output — do not hand-edit them.

`frontend/AGENTS.md` (loaded automatically) flags that this Next.js version has framework changes not reflected in training data — check `node_modules/next/dist/docs/` before relying on prior Next.js knowledge for App Router APIs.

## Environment variables

Backend `.env` (see `backend/.env.example`): `DATABASE_URL`, `JWT_SECRET`/`JWT_REFRESH_SECRET` (+ expiry vars), SMTP vars, Twilio vars, Google OAuth vars, `UPLOAD_DIR`, `FRONTEND_URL` (used for CORS).
Frontend `.env.local`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`.

⚠️ `backend/.env.example` currently contains a live-looking Supabase `DATABASE_URL` with an embedded password, committed to git — treat this as compromised and do not add further real credentials to any `.env.example` file; only placeholder values belong there.
