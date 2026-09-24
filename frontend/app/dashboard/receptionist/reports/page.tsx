'use client';

import Link from 'next/link';
import { ArrowLeft, FileBarChart } from 'lucide-react';
import HospitalReportsPanel from '@/components/reports/HospitalReportsPanel';

export default function ReceptionistReportsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 text-sm font-medium mb-5 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <FileBarChart className="w-6 h-6 text-cyan-600" />
          Reports
        </h1>
        <p className="page-subtitle">
          Appointment, patient, and billing records — filter by date, doctor, or status, then export or print.
        </p>
      </div>

      <div className="mt-6">
        <HospitalReportsPanel />
      </div>
    </div>
  );
}
