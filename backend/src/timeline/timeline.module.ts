import { Module } from '@nestjs/common';

// Timeline is handled directly in Patients and Appointments services
// This module exposes the timeline endpoint via PatientsController
@Module({})
export class TimelineModule {}
