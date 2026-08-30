'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  children,
  className,
  showClose = true,
}: {
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
      <RadixDialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl data-[state=open]:animate-scale-up focus:outline-none',
          className,
        )}
      >
        {children}
        {showClose && (
          <RadixDialog.Close className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </RadixDialog.Close>
        )}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Title
      className={cn(
        'text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4',
        className,
      )}
    >
      {children}
    </RadixDialog.Title>
  );
}
