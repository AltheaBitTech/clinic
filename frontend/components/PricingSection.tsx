'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle, Activity, Shield, Sparkles } from 'lucide-react';

const featureColorMap: Record<string, { bg: string; text: string; border: string }> = {
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

const plans = [
  {
    name: 'Free Trial',
    price: '₹0',
    period: '/ 15 days',
    tagline: 'Try every feature, no card required',
    icon: Sparkles,
    color: 'emerald',
    popular: false,
    cta: 'Start Free Trial',
    features: [
      'Full access for 15 days',
      'Up to 2 doctors & 50 patients',
      'Appointments & prescriptions',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: '₹2,999',
    period: '/ month',
    tagline: 'For growing clinics & hospitals',
    icon: Activity,
    color: 'cyan',
    popular: true,
    cta: 'Get Started',
    features: [
      'Unlimited doctors & patients',
      'Digital prescriptions & PDF sharing',
      'Medicine & appointment reminders',
      'Real-time chat support',
      'Priority email & chat support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    tagline: 'For multi-branch hospital networks',
    icon: Shield,
    color: 'purple',
    popular: false,
    cta: 'Contact Sales',
    features: [
      'Everything in Professional',
      'Multi-branch tenant management',
      'Custom integrations & SLAs',
      'Dedicated account manager',
    ],
  },
];

function PricingSectionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan');

  const selectPlan = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('plan', name);
    router.push(`/?${params.toString()}#register-form`, { scroll: false });
    document.getElementById('register-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {plans.map(({ name, price, period, tagline, icon: Icon, color, popular, cta, features }) => {
        const mapped = featureColorMap[color] || featureColorMap.cyan;
        const isSelected = selectedPlan === name;
        return (
          <div
            key={name}
            className={`relative rounded-2xl p-7 border transition-all duration-300 ${
              isSelected
                ? 'bg-white/[0.06] border-cyan-400/70 shadow-lg shadow-cyan-600/20 ring-1 ring-cyan-400/40'
                : popular
                ? 'bg-white/[0.05] border-cyan-500/40 shadow-lg shadow-cyan-600/10 md:-translate-y-3'
                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-1.5'
            }`}
          >
            {isSelected ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-bold px-3.5 py-1 rounded-full shadow-md">
                Selected
              </span>
            ) : popular ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-md">
                Most Popular
              </span>
            ) : null}
            <div className={`w-11 h-11 rounded-xl ${mapped.bg} ${mapped.border} border flex items-center justify-center mb-5`}>
              <Icon className={`w-5 h-5 ${mapped.text}`} />
            </div>
            <h3 className="font-bold text-xl mb-1 text-slate-100">{name}</h3>
            <p className="text-slate-400 text-sm mb-5 font-light">{tagline}</p>
            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-3.5xl font-extrabold text-white">{price}</span>
              <span className="text-slate-400 text-sm font-light">{period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300 font-light">
                  <CheckCircle className={`w-4 h-4 ${mapped.text} mt-0.5 shrink-0`} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => selectPlan(name)}
              className={`w-full flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl transition-all cursor-pointer ${
                isSelected || popular
                  ? 'btn-primary shadow-md'
                  : 'bg-white/5 text-white hover:bg-white/10 border border-white/15 backdrop-blur-sm'
              }`}
            >
              {cta} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function PricingSection() {
  return (
    <Suspense fallback={null}>
      <PricingSectionInner />
    </Suspense>
  );
}
