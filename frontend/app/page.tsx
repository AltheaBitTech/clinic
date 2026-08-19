import Link from 'next/link';
import Image from 'next/image';
import { Calendar, FileText, Bell, Shield, Users, ArrowRight, CheckCircle, Activity } from 'lucide-react';
import ClinicRequestForm from '@/components/ClinicRequestForm';
import PricingSection from '@/components/PricingSection';

const featureColorMap: Record<string, { bg: string; text: string; border: string }> = {
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 text-white overflow-x-hidden relative">
      {/* Visual Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-lg border-b border-white/5">
        <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <Image src="/arogyix-logo.svg" alt="Arogyix" width={36} height={36} className="drop-shadow-md" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Arogyix</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#pricing" className="hidden sm:inline text-slate-300 hover:text-white transition-colors text-sm font-semibold">
              Pricing
            </a>
            <Link href="/login" className="text-slate-300 hover:text-white transition-colors text-sm font-semibold">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm shadow-md">
              Get Started Free
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 text-center relative">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4.5 py-1.5 text-xs font-semibold text-cyan-300 mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          Multi-Tenant Hospital SaaS Platform
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-4 bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent tracking-tight">
          Healthcare management <br className="hidden md:inline" /> made simple.
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Appointments, digital prescriptions, medicine reminders, patient timelines, and real-time chat — unified in a single, high-performance platform.
        </p>
        <div className="flex items-center justify-center gap-4.5 flex-wrap animate-slide-up">
          <Link href="/register" className="btn-primary flex items-center gap-2 text-base px-4 sm:px-6 lg:px-8 py-3.5 shadow-lg">
            Start for Free <ArrowRight className="w-4.5 h-4.5" />
          </Link>
          <Link href="/login" className="btn-secondary text-base px-4 sm:px-6 lg:px-8 py-3.5 bg-white/5 text-white hover:bg-white/10 border border-white/15 backdrop-blur-sm">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 relative">
        <div className="absolute -left-20 top-40 w-80 h-80 bg-emerald-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3 tracking-tight">Everything your clinic needs</h2>
        <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto font-light">From individual doctors to multi-speciality hospitals, Arogyix scales with your operation.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Calendar, color: 'cyan', title: 'Smart Appointments', desc: 'Book, reschedule, and track appointments. Automatic reminders 24h before.' },
            { icon: FileText, color: 'emerald', title: 'Digital Prescriptions', desc: 'Write prescriptions digitally. PDFs auto-generated and shared via WhatsApp & email.' },
            { icon: Bell, color: 'amber', title: 'Medicine Reminders', desc: 'Push, SMS, WhatsApp, and email reminders for every medicine schedule.' },
            { icon: Activity, color: 'purple', title: 'Patient Timeline', desc: 'Chronological view of every visit, prescription, test, and follow-up.' },
            { icon: Shield, color: 'blue', title: 'Multi-Tenant Security', desc: 'Every hospital is fully isolated. RBAC with 5 roles. JWT auth.' },
            { icon: Users, color: 'rose', title: 'Family Health Records', desc: 'Patients can manage health records for their entire family.' },
          ].map(({ icon: Icon, color, title, desc }) => {
            const mapped = featureColorMap[color] || featureColorMap.cyan;
            return (
              <div key={title} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6.5 hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-1.5 transition-all duration-300 group">
                <div className={`w-11 h-11 rounded-xl ${mapped.bg} ${mapped.border} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 ${mapped.text}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2.5 text-slate-100 group-hover:text-white transition-colors">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* User Roles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 relative">
        <h2 className="text-3xl font-extrabold text-center mb-12 tracking-tight">Built for every role</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {[
            { role: 'Super Admin', desc: 'Platform & billing', color: 'purple' },
            { role: 'Hospital Admin', desc: 'Staff & reports', color: 'blue' },
            { role: 'Doctor', desc: 'Appointments & Rx', color: 'emerald' },
            { role: 'Receptionist', desc: 'Registration & billing', color: 'amber' },
            { role: 'Patient', desc: 'Health portal', color: 'rose' },
          ].map(({ role, desc, color }) => {
            const mapped = featureColorMap[color] || featureColorMap.cyan;
            return (
              <div key={role} className={`${mapped.bg} ${mapped.border} border rounded-2xl p-5.5 text-center hover:bg-white/[0.02] transition-colors duration-300`}>
                <div className={`${mapped.text} font-bold text-base mb-1.5`}>{role}</div>
                <div className="text-slate-400 text-xs leading-relaxed font-light">{desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 relative scroll-mt-24">
        <div className="absolute -right-20 top-20 w-80 h-80 bg-cyan-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3 tracking-tight">Simple, transparent pricing</h2>
        <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto font-light">Start free, then pick the plan that fits your clinic. No hidden fees.</p>
        <PricingSection />
      </section>

      {/* Partner Registration Form */}
      <section id="register-form" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 relative scroll-mt-24">
        <div className="absolute right-0 bottom-10 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <ClinicRequestForm />
        <p className="text-center text-sm text-slate-400 mt-6 font-light">
          Own a pharmacy instead?{' '}
          <Link href="/register/pharmacy-business" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
            Register your pharmacy independently
          </Link>
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 text-center">
        <div className="bg-gradient-to-r from-cyan-900/40 to-emerald-900/40 border border-cyan-500/20 rounded-3xl p-12 md:p-16 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3.5xl font-extrabold mb-4 tracking-tight">Ready to transform your practice?</h2>
          <p className="text-slate-300 mb-8 max-w-lg mx-auto font-light leading-relaxed">Join progressive clinics and hospitals utilizing Arogyix to streamline care delivery.</p>
          <Link href="/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2 shadow-lg shadow-cyan-600/20">
            Get Started Free <ArrowRight className="w-4.5 h-4.5" />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-10 text-xs text-slate-400 flex-wrap">
            {['No credit card required', 'Free 15-day trial', 'Cancel anytime'].map((t) => (
              <span key={t} className="flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 text-center text-slate-500 text-sm bg-slate-950/40">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Image src="/arogyix-logo.svg" alt="Arogyix" width={20} height={20} />
          <span className="font-bold text-white tracking-wider">Arogyix</span>
        </div>
        <p className="font-light text-xs text-slate-500">© 2026 Arogyix. Healthcare management made simple.</p>
      </footer>
    </div>
  );
}
