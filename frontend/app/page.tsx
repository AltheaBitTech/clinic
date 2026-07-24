import Link from 'next/link';
import { Activity, Calendar, FileText, Bell, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react';
import ClinicRequestForm from '@/components/ClinicRequestForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">CareSync</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-20 pb-28 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          Multi-Tenant Hospital SaaS Platform
        </div>
        <h1 className="text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
          The Modern OS<br />for Healthcare
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Appointments, digital prescriptions, medicine reminders, patient timelines, and real-time chat — all in one platform.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
            Start for Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-3.5 bg-white/10 text-white hover:bg-white/20 border border-white/20">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-8 pb-28">
        <h2 className="text-3xl font-bold text-center mb-4">Everything your clinic needs</h2>
        <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">From individual doctors to multi-speciality hospitals, CareSync scales with you.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Calendar, color: 'indigo', title: 'Smart Appointments', desc: 'Book, reschedule, and track appointments. Automatic reminders 24h before.' },
            { icon: FileText, color: 'emerald', title: 'Digital Prescriptions', desc: 'Write prescriptions digitally. PDFs auto-generated and shared via WhatsApp & email.' },
            { icon: Bell, color: 'amber', title: 'Medicine Reminders', desc: 'Push, SMS, WhatsApp, and email reminders for every medicine schedule.' },
            { icon: Activity, color: 'purple', title: 'Patient Timeline', desc: 'Chronological view of every visit, prescription, test, and follow-up.' },
            { icon: Shield, color: 'blue', title: 'Multi-Tenant Security', desc: 'Every hospital is fully isolated. RBAC with 5 roles. JWT auth.' },
            { icon: Users, color: 'rose', title: 'Family Health Records', desc: 'Patients can manage health records for their entire family.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200">
              <div className={`w-11 h-11 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* User Roles */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Built for every role</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { role: 'Super Admin', desc: 'Platform & billing', color: 'purple' },
            { role: 'Hospital Admin', desc: 'Staff & reports', color: 'blue' },
            { role: 'Doctor', desc: 'Appointments & Rx', color: 'emerald' },
            { role: 'Receptionist', desc: 'Registration & billing', color: 'amber' },
            { role: 'Patient', desc: 'Health portal', color: 'rose' },
          ].map(({ role, desc, color }) => (
            <div key={role} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-2xl p-4 text-center`}>
              <div className={`text-${color}-400 font-bold mb-1`}>{role}</div>
              <div className="text-slate-400 text-xs">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Registration Form */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <ClinicRequestForm />
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-8 pb-24 text-center">
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your practice?</h2>
          <p className="text-slate-400 mb-8">Join clinics and hospitals already using CareSync to improve patient care.</p>
          <Link href="/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-400">
            {['No credit card required', 'Free 30-day trial', 'Cancel anytime'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white">CareSync</span>
        </div>
        <p>© 2025 CareSync. Multi-tenant hospital management SaaS.</p>
      </footer>
    </div>
  );
}
