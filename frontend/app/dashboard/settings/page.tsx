'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { usersApi, tenantsApi } from '@/lib/api';
import { 
  Settings, User, Building2, Save, Loader2, Sparkles, Mail, Phone, MapPin, Upload 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'hospital'>('profile');

  // Profile Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Hospital Form States
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalEmail, setHospitalEmail] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalCity, setHospitalCity] = useState('');
  const [hospitalState, setHospitalState] = useState('');
  const [hospitalCountry, setHospitalCountry] = useState('');

  // Populate fields on load
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');

      if (user.tenant) {
        setHospitalName(user.tenant.name || '');
        setHospitalEmail(user.tenant.email || '');
        setHospitalPhone(user.tenant.phone || '');
        setHospitalAddress(user.tenant.address || '');
        setHospitalCity(user.tenant.city || '');
        setHospitalState(user.tenant.state || '');
        setHospitalCountry(user.tenant.country || '');
      }
    }
  }, [user]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (payload: any) => usersApi.updateProfile(payload),
    onSuccess: async () => {
      await refreshProfile();
      toast.success('Personal profile updated!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    }
  });

  const updateHospitalMutation = useMutation({
    mutationFn: (payload: any) => tenantsApi.update(user?.tenantId || '', payload),
    onSuccess: async () => {
      await refreshProfile();
      toast.success('Hospital settings updated!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update hospital details';
      toast.error(msg);
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    updateProfileMutation.mutate({
      firstName,
      lastName,
      phone: phone || undefined,
      avatarUrl: avatarUrl || undefined,
    });
  };

  const handleHospitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName.trim()) {
      toast.error('Hospital name is required');
      return;
    }
    updateHospitalMutation.mutate({
      name: hospitalName,
      email: hospitalEmail || undefined,
      phone: hospitalPhone || undefined,
      address: hospitalAddress || undefined,
      city: hospitalCity || undefined,
      state: hospitalState || undefined,
      country: hospitalCountry || undefined,
    });
  };

  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="page-header mb-8">
        <h1 className="page-title flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Account & Portal Settings
        </h1>
        <p className="page-subtitle">Configure your personal login details, contact profile, and hospital branding settings.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" /> Personal Profile
        </button>
        {isHospitalAdmin && (
          <button
            onClick={() => setActiveTab('hospital')}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'hospital'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" /> Hospital Settings
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === 'profile' ? (
        <form onSubmit={handleProfileSubmit} className="card space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Personal Login Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address (Read-only)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="input pl-10 bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Portal Role (Read-only)
              </label>
              <input
                type="text"
                disabled
                value={user?.role?.replace('_', ' ') || ''}
                className="input bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200 uppercase font-bold text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Avatar Image / Profile Picture (Optional)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                {/* Avatar Preview */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-indigo-50 flex items-center justify-center text-indigo-700 text-2xl font-bold">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl.startsWith('http') ? avatarUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'}${avatarUrl}`}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {firstName && lastName
                          ? (firstName[0] + lastName[0]).toUpperCase()
                          : (user?.firstName?.[0] || 'U').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Upload Actions */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="btn-primary flex items-center gap-2 text-sm cursor-pointer py-2 px-4 shadow-sm hover:shadow transition-all bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Photo
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingAvatar}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (!file.type.startsWith('image/')) {
                            toast.error('Please upload an image file');
                            return;
                          }
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error('Image size must be less than 2MB');
                            return;
                          }

                          setIsUploadingAvatar(true);
                          const fd = new FormData();
                          fd.append('file', file);

                          try {
                            const { data } = await usersApi.uploadAvatar(fd);
                            setAvatarUrl(data.url);
                            toast.success('Avatar image uploaded successfully!');
                          } catch (err: any) {
                            const msg = err.response?.data?.message || 'Failed to upload avatar image';
                            toast.error(msg);
                          } finally {
                            setIsUploadingAvatar(false);
                          }
                        }}
                      />
                    </label>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg transition-all"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">
                    Supports JPG, PNG, GIF up to 2MB. Or manually provide a direct URL link below:
                  </p>

                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="input text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-3 border-t border-slate-100 mt-6">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn-primary flex items-center gap-2 font-bold px-5"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile Details
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleHospitalSubmit} className="card space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Hospital Branding Details</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Hospital / Clinic Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              placeholder="Arogyix Hospital & Research"
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Hospital Contact Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={hospitalEmail}
                  onChange={(e) => setHospitalEmail(e.target.value)}
                  placeholder="contact@hospital.com"
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Hospital Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={hospitalPhone}
                  onChange={(e) => setHospitalPhone(e.target.value)}
                  placeholder="+1 (234) 567-890"
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Branding Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                value={hospitalAddress}
                onChange={(e) => setHospitalAddress(e.target.value)}
                placeholder="Clinic Block 2, Medical Street"
                className="input pl-10 min-h-[60px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                type="text"
                value={hospitalCity}
                onChange={(e) => setHospitalCity(e.target.value)}
                placeholder="Mumbai"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                State / Province
              </label>
              <input
                type="text"
                value={hospitalState}
                onChange={(e) => setHospitalState(e.target.value)}
                placeholder="Maharashtra"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={hospitalCountry}
                onChange={(e) => setHospitalCountry(e.target.value)}
                placeholder="India"
                className="input"
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-3 border-t border-slate-100 mt-6">
            <button
              type="submit"
              disabled={updateHospitalMutation.isPending}
              className="btn-primary flex items-center gap-2 font-bold px-5"
            >
              {updateHospitalMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving branding...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Clinic branding
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
