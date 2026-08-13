'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, patientsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FileText, Upload, Download, Trash2, Search, X, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

const REPORT_TYPES = ['ALL', 'BLOOD_TEST', 'XRAY', 'MRI', 'CT_SCAN', 'ULTRASOUND', 'ECG', 'PRESCRIPTION', 'OTHER'];

const TYPE_ICONS: Record<string, string> = {
  BLOOD_TEST: '🩸', XRAY: '🫁', MRI: '🧠', CT_SCAN: '💉',
  ULTRASOUND: '🔊', ECG: '❤️', PRESCRIPTION: '💊', OTHER: '📄',
};

export default function ReportsPage() {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [typeFilter, setTypeFilter] = useState('ALL');
  const [uploading, setUploading] = useState(false);

  // Which patient the next upload will be linked to. Staff pick one; patients use their own profile.
  const [uploadPatient, setUploadPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  const { data: myPatientProfile } = useQuery({
    queryKey: ['my-patient-profile'],
    queryFn: () => patientsApi.getMe().then((r) => r.data),
    enabled: isPatient,
  });

  useEffect(() => {
    if (isPatient && myPatientProfile) setUploadPatient(myPatientProfile);
  }, [isPatient, myPatientProfile]);

  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients-search-reports', patientSearch],
    queryFn: () => patientsApi.getAll({ search: patientSearch, limit: 8 }).then((r) => r.data),
    enabled: !isPatient,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.getAll().then((r) => r.data),
  });

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

  const filteredReports = (data?.data || []).filter(
    (r: any) => typeFilter === 'ALL' || r.type === typeFilter,
  );

  const handleUploadClick = () => {
    if (!uploadPatient) {
      toast.error('Select a patient before uploading a report');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadPatient) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', file.name);
    fd.append('type', 'OTHER');
    fd.append('patientId', uploadPatient.id);

    setUploading(true);
    try {
      await reportsApi.upload(fd);
      toast.success('Report uploaded');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await reportsApi.delete(id);
      toast.success('Report deleted');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete report');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Report Repository</h1>
          <p className="page-subtitle">Upload and manage all medical reports chronologically</p>
        </div>

        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
          {!isPatient && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={patientSearch}
                onFocus={() => setIsPatientDropdownOpen(true)}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setIsPatientDropdownOpen(true);
                  setUploadPatient(null);
                }}
                placeholder="Select patient to upload for..."
                className="input pl-9 text-xs py-1.5"
              />
              {uploadPatient && (
                <button
                  type="button"
                  onClick={() => { setUploadPatient(null); setPatientSearch(''); }}
                  aria-label="Clear selected patient"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {isPatientDropdownOpen && !uploadPatient && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsPatientDropdownOpen(false)} />
                  <div className="absolute right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-50">
                    {isLoadingPatients ? (
                      <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
                      </div>
                    ) : patientsData?.data?.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No patients found</div>
                    ) : (
                      patientsData?.data?.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setUploadPatient(p);
                            setPatientSearch(`${p.user.firstName} ${p.user.lastName}`);
                            setIsPatientDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2.5 hover:bg-slate-50 text-left transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {getInitials(p.user.firstName, p.user.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800 truncate">{p.user.firstName} {p.user.lastName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{p.patientCode}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleUploadClick}
            disabled={uploading || (!isPatient && !uploadPatient)}
            className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Report
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            aria-label="Upload report file"
          />
        </div>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {REPORT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 whitespace-nowrap border ${
              typeFilter === t
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-10 w-10 bg-slate-100 rounded-xl mb-4" />
              <div className="h-5 bg-slate-100 rounded mb-2" />
              <div className="h-4 bg-slate-100 rounded w-24" />
            </div>
          ))
        ) : isError ? (
          <div className="col-span-full card text-center py-16">
            <AlertTriangle className="w-12 h-12 text-red-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Couldn&apos;t load reports</p>
            <p className="text-slate-400 text-sm mt-1">Something went wrong. Please try again.</p>
            <button onClick={() => refetch()} className="btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="col-span-full card text-center py-16">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">
              {data?.data?.length === 0 ? 'No reports uploaded yet' : 'No reports match this type'}
            </p>
          </div>
        ) : (
          filteredReports.map((report: any) => (
            <div key={report.id} className="card card-hover group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                  {TYPE_ICONS[report.type] || '📄'}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <a href={`${BASE_URL}${report.fileUrl}`} target="_blank" rel="noreferrer"
                    aria-label={`Download ${report.title}`}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <Download className="w-4 h-4 text-slate-500" />
                  </a>
                  <button onClick={() => handleDelete(report.id, report.title)}
                    aria-label={`Delete ${report.title}`}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1 truncate">{report.title}</h3>
              <p className="text-xs text-slate-400 mb-3">{report.type.replace('_', ' ')} · {formatDate(report.createdAt)}</p>
              {report.labName && <p className="text-xs text-slate-500">🏥 {report.labName}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
