'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { patientsApi } from '@/lib/api';
import {
  ArrowLeft, User, Mail, Phone, Calendar, Heart, Plus, X,
  MapPin, ShieldAlert, FileText, Loader2, Sparkles, ChevronDown,
  Copy, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PatientCredentials {
  email: string;
  temporaryPassword: string;
}

function CredentialsModal({
  credentials, onClose,
}: { credentials: PatientCredentials | null; onClose: () => void }) {
  if (!credentials) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden transform transition-all">
        <div className="p-6 border-b border-slate-50 bg-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Patient Registered!</h3>
              <p className="text-xs text-indigo-700 font-medium">Patient Login Account Created</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Login Email</label>
            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-lg">
              <span className="text-sm text-slate-700 font-medium truncate">{credentials.email}</span>
              <button
                onClick={() => handleCopy(credentials.email, 'Email')}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Temporary Password</label>
            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-indigo-100 bg-indigo-50/20">
              <span className="text-sm font-mono text-indigo-700 font-semibold">{credentials.temporaryPassword}</span>
              <button
                onClick={() => handleCopy(credentials.temporaryPassword, 'Password')}
                className="p-1 hover:bg-indigo-100 rounded text-indigo-600 hover:text-indigo-800 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Share these details with the patient now. For security reasons, the temporary password will not be shown again.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewPatientPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<PatientCredentials | null>(null);

  // Basic Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Demographics
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('MALE');
  const [bloodGroup, setBloodGroup] = useState('O_POS');

  // Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  // Medical History
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [chronicInput, setChronicInput] = useState('');
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAllergy = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (allergyInput.trim()) {
        if (!allergies.includes(allergyInput.trim())) {
          setAllergies([...allergies, allergyInput.trim()]);
        }
        setAllergyInput('');
      }
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleAddChronic = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (chronicInput.trim()) {
        if (!chronicConditions.includes(chronicInput.trim())) {
          setChronicConditions([...chronicConditions, chronicInput.trim()]);
        }
        setChronicInput('');
      }
    }
  };

  const handleRemoveChronic = (index: number) => {
    setChronicConditions(chronicConditions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email) {
      toast.error('First Name, Last Name, and Email are required.');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Registering new patient...');

    try {
      const payload = {
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender,
        bloodGroup,
        address: address || undefined,
        city: city || undefined,
        emergencyName: emergencyName || undefined,
        emergencyPhone: emergencyPhone || undefined,
        emergencyRelation: emergencyRelation || undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        chronicConditions: chronicConditions.length > 0 ? chronicConditions : undefined,
        notes: notes || undefined,
      };

      const { data } = await patientsApi.create(payload);
      toast.success('Patient registered successfully!', { id: loadingToast });
      if (data?.temporaryPassword) {
        setCredentials({ email: data.user?.email || email, temporaryPassword: data.temporaryPassword });
      } else {
        router.push('/dashboard/patients');
        router.refresh();
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to register patient';
      toast.error(errMsg, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <Link href="/dashboard/patients" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse shrink-0" /> Register New Patient
            </h1>
            <p className="page-subtitle">Create a patient account and compile their clinical profile</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Account Information */}
        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-indigo-500" /> Account Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Doe"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Demographics & Address */}
        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Heart className="w-5 h-5 text-red-500" /> Demographics & Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  max={todayStr}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Gender
              </label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="input appearance-none pr-10"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Blood Group
              </label>
              <div className="relative">
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="input appearance-none pr-10"
                >
                  <option value="O_POS">O+</option>
                  <option value="O_NEG">O-</option>
                  <option value="A_POS">A+</option>
                  <option value="A_NEG">A-</option>
                  <option value="B_POS">B+</option>
                  <option value="B_NEG">B-</option>
                  <option value="AB_POS">AB+</option>
                  <option value="AB_NEG">AB-</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Residential Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street details, building, apartment..."
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Contact */}
        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> Emergency Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Full Name"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Relation
              </label>
              <input
                type="text"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                placeholder="e.g. Spouse, Parent, Sibling"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Clinical History */}
        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-indigo-500" /> Clinical History & Notes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Allergies
              </label>
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={handleAddAllergy}
                placeholder="Type and press Enter to add..."
                className="input mb-3"
              />
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, index) => (
                  <span key={index} className="badge bg-red-50 text-red-600 flex items-center gap-1 py-1 px-2 text-xs">
                    {allergy}
                    <button type="button" onClick={() => handleRemoveAllergy(index)} className="hover:text-red-800">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {allergies.length === 0 && <span className="text-xs text-slate-400">No allergies specified</span>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Chronic Conditions
              </label>
              <input
                type="text"
                value={chronicInput}
                onChange={(e) => setChronicInput(e.target.value)}
                onKeyDown={handleAddChronic}
                placeholder="Type and press Enter to add..."
                className="input mb-3"
              />
              <div className="flex flex-wrap gap-2">
                {chronicConditions.map((condition, index) => (
                  <span key={index} className="badge bg-amber-50 text-amber-600 flex items-center gap-1 py-1 px-2 text-xs">
                    {condition}
                    <button type="button" onClick={() => handleRemoveChronic(index)} className="hover:text-amber-800">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {chronicConditions.length === 0 && <span className="text-xs text-slate-400">No chronic conditions specified</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Clinical Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add patient history, special care guidelines, or family traits..."
              className="input resize-none"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/patients" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Registering...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Register Patient
              </>
            )}
          </button>
        </div>
      </form>

      <CredentialsModal
        credentials={credentials}
        onClose={() => {
          setCredentials(null);
          router.push('/dashboard/patients');
          router.refresh();
        }}
      />
    </div>
  );
}
