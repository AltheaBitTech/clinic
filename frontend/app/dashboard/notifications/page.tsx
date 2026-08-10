'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { timeAgo, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const CHANNEL_COLORS: Record<string, string> = {
  PUSH: 'bg-blue-100 text-blue-600',
  EMAIL: 'bg-emerald-100 text-emerald-600',
  SMS: 'bg-amber-100 text-amber-600',
  WHATSAPP: 'bg-green-100 text-green-600',
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read'); },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{data?.unread || 0} unread notifications</p>
        </div>
        {data?.unread > 0 && (
          <button onClick={() => markAllRead.mutate()} className="btn-secondary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2 max-w-2xl">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-48" />
                <div className="h-3 bg-slate-100 rounded w-64" />
              </div>
            </div>
          ))
        ) : data?.data?.length === 0 ? (
          <div className="card text-center py-16">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No notifications yet</p>
          </div>
        ) : (
          data?.data?.map((n: any) => (
            <div key={n.id}
              className={cn('flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer',
                n.readAt ? 'bg-white border-slate-100' : 'bg-indigo-50/50 border-indigo-100'
              )}
              onClick={() => !n.readAt && notificationsApi.markRead(n.id).then(() => qc.invalidateQueries({ queryKey: ['notifications'] }))}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0', CHANNEL_COLORS[n.channel])}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('font-medium text-sm', n.readAt ? 'text-slate-700' : 'text-slate-900')}>{n.title}</p>
                  {!n.readAt && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              <span className={cn('badge text-xs shrink-0', CHANNEL_COLORS[n.channel])}>{n.channel}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
