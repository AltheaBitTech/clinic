'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const REPORT_TYPES = ['ALL', 'BLOOD_TEST', 'XRAY', 'MRI', 'CT_SCAN', 'ULTRASOUND', 'ECG', 'PRESCRIPTION', 'OTHER'];

const TYPE_ICONS: Record<string, string> = {
  BLOOD_TEST: '🩸', XRAY: '🫁', MRI: '🧠', CT_SCAN: '💉',
  ULTRASOUND: '🔊', ECG: '❤️', PRESCRIPTION: '💊', OTHER: '📄',
};

export default function ReportsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.getAll().then((r) => r.data),
  });

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Report Repository</h1>
          <p className="page-subtitle">Upload and manage all medical reports chronologically</p>
        </div>
        <label className="btn-primary flex items-center justify-center gap-2 text-sm cursor-pointer w-full sm:w-auto">
          <Upload className="w-4 h-4" /> Upload Report
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('file', file);
            fd.append('title', file.name);
            fd.append('type', 'OTHER');
            fd.append('patientId', ''); // Would come from selected patient
            await reportsApi.upload(fd);
            refetch();
          }} />
        </label>
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
        ) : data?.data?.length === 0 ? (
          <div className="col-span-3 card text-center py-16">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No reports uploaded yet</p>
          </div>
        ) : (
          data?.data?.map((report: any) => (
            <div key={report.id} className="card card-hover group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                  {TYPE_ICONS[report.type] || '📄'}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`${BASE_URL}${report.fileUrl}`} target="_blank" rel="noreferrer"
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <Download className="w-4 h-4 text-slate-500" />
                  </a>
                  <button onClick={() => reportsApi.delete(report.id).then(() => refetch())}
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
