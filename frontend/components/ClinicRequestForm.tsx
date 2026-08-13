'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { tenantRequestsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, Building2, Mail, Phone, User, MapPin, Tag } from 'lucide-react';

export default function ClinicRequestForm() {
  return (
    <Suspense fallback={null}>
      <ClinicRequestFormInner />
    </Suspense>
  );
}

function ClinicRequestFormInner() {
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Clinic or Hospital name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await tenantRequestsApi.create(form);
      setSubmitted(true);
      toast.success('Registration request submitted successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || 'Failed to submit registration request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-slate-900/60 border border-emerald-500/30 rounded-3xl p-10 text-center backdrop-blur-md max-w-xl mx-auto my-8 animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Request Received!</h3>
        <p className="text-slate-300 leading-relaxed mb-6">
          Thank you for requesting to register <strong>{form.name}</strong> on Arogyix. 
          Our platform administrators will review your request and get in touch with you at <strong>{form.email}</strong> to set up your account.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({
              name: '',
              email: '',
              firstName: '',
              lastName: '',
              phone: '',
              address: '',
              city: '',
              state: '',
            });
          }}
          className="text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors duration-200"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-sm max-w-3xl mx-auto shadow-2xl">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Register Your Clinic / Hospital</h3>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Fill out the details below to request access. A platform administrator will set up your tenant account and invite you as a Hospital Admin.
        </p>
        {selectedPlan && (
          <div className="inline-flex items-center gap-1.5 mt-4 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold px-3.5 py-1.5 rounded-full">
            <Tag className="w-3.5 h-3.5" /> Selected plan: {selectedPlan}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Clinic Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">1. Clinic Details</h4>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" /> Clinic / Hospital Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., City Care Hospital"
              className={`w-full bg-white/5 border ${
                errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-cyan-500'
              } rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all`}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
        </div>

        {/* Section 2: Contact Admin */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">2. Administrator Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Admin First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="John"
                className={`w-full bg-white/5 border ${
                  errors.firstName ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-cyan-500'
                } rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Admin Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className={`w-full bg-white/5 border ${
                  errors.lastName ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-cyan-500'
                } rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> Admin Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@hospital.com"
                className={`w-full bg-white/5 border ${
                  errors.email ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-cyan-500'
                } rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" /> Phone Number (Optional)
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Location */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> 3. Location (Optional)
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Street Address</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Health Ave, Suite 400"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="New York"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">State / Province</label>
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="NY"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting request...
            </>
          ) : (
            'Submit Registration Request'
          )}
        </button>
      </form>
    </div>
  );
}
