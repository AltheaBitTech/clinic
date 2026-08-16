import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { DepartmentsModule } from './departments/departments.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BillingModule } from './billing/billing.module';
import { TimelineModule } from './timeline/timeline.module';
import { RemindersModule } from './reminders/reminders.module';
import { TenantRequestsModule } from './tenant-requests/tenant-requests.module';
import { MedicalCatalogModule } from './medical-catalog/medical-catalog.module';
import { PharmaciesModule } from './pharmacies/pharmacies.module';
import { PharmacySharedModule } from './pharmacy-shared/pharmacy-shared.module';
import { PharmacyCatalogModule } from './pharmacy-catalog/pharmacy-catalog.module';
import { PharmacyInventoryModule } from './pharmacy-inventory/pharmacy-inventory.module';
import { PharmacySuppliersModule } from './pharmacy-suppliers/pharmacy-suppliers.module';
import { PharmacyPurchasesModule } from './pharmacy-purchases/pharmacy-purchases.module';
import { PharmacyPrescriptionsModule } from './pharmacy-prescriptions/pharmacy-prescriptions.module';
import { PharmacySalesModule } from './pharmacy-sales/pharmacy-sales.module';
import { PharmacyReportsModule } from './pharmacy-reports/pharmacy-reports.module';
import { PharmacyDashboardModule } from './pharmacy-dashboard/pharmacy-dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    DoctorsModule,
    DepartmentsModule,
    PatientsModule,
    AppointmentsModule,
    PrescriptionsModule,
    ReportsModule,
    NotificationsModule,
    ChatModule,
    DashboardModule,
    BillingModule,
    TimelineModule,
    RemindersModule,
    TenantRequestsModule,
    MedicalCatalogModule,
    PharmaciesModule,
    PharmacySharedModule,
    PharmacyCatalogModule,
    PharmacyInventoryModule,
    PharmacySuppliersModule,
    PharmacyPurchasesModule,
    PharmacyPrescriptionsModule,
    PharmacySalesModule,
    PharmacyReportsModule,
    PharmacyDashboardModule,
  ],
})
export class AppModule {}
