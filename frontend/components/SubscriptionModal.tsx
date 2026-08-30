'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Check, Loader2, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const TIER_STYLES: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-700 border-slate-200/50',
  BASIC: 'bg-blue-50 text-blue-700 border-blue-200/50',
  PROFESSIONAL: 'bg-cyan-50 text-cyan-700 border-cyan-200/50',
  ENTERPRISE: 'bg-purple-50 text-purple-700 border-purple-200/50',
};

export function SubscriptionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [selectingPlanId, setSelectingPlanId] = useState<string | null>(null);

  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionApi.getPlans().then((r) => r.data),
    enabled: open,
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: () => subscriptionApi.getCurrent().then((r) => r.data),
    enabled: open,
    refetchInterval: (query) =>
      query.state.data?.status === 'CREATED' ? 3000 : false,
  });

  const openRazorpayCheckout = (checkout: any, planName: string) => {
    if (!window.Razorpay) {
      toast.error('Payment gateway is still loading — please try again in a moment');
      return;
    }
    const rzp = new window.Razorpay({
      key: checkout.razorpayKeyId,
      subscription_id: checkout.razorpaySubscriptionId,
      name: 'Arogyix',
      description: planName,
      handler: () => {
        toast.success('Payment successful — activating your plan...');
        qc.invalidateQueries({ queryKey: ['current-subscription'] });
        onOpenChange(false);
      },
      prefill: {
        name: user?.tenant?.name,
        email: user?.email,
        contact: user?.phone,
      },
      theme: { color: '#0891b2' },
      modal: {
        ondismiss: () => toast('Checkout cancelled'),
      },
    });
    rzp.open();
  };

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => subscriptionApi.checkout(planId).then((r) => r.data),
    onSuccess: (data, planId) => {
      if (!data.razorpaySubscriptionId) {
        toast.success('Switched to Free plan');
        qc.invalidateQueries({ queryKey: ['current-subscription'] });
        onOpenChange(false);
        return;
      }
      const plan = plans?.find((p: any) => p.id === planId);
      openRazorpayCheckout(data, plan?.name || 'Subscription');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start checkout');
    },
    onSettled: () => setSelectingPlanId(null),
  });

  const handleSelect = (planId: string) => {
    setSelectingPlanId(planId);
    checkoutMutation.mutate(planId);
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onReady={() => setRazorpayReady(true)}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>
            <Crown className="w-5 h-5 text-cyan-600" />
            Manage Subscription
          </DialogTitle>

          {isLoadingPlans ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* {JSON.stringify(currentSubscription)} */}
              {plans?.map((plan: any) => {
                const isCurrent = currentSubscription?.planId === plan.id;
                const isSelecting = selectingPlanId === plan.id && checkoutMutation.isPending;
                const features: string[] = Array.isArray(plan.features) ? plan.features : [];
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'rounded-xl border p-4 flex flex-col gap-3',
                      isCurrent ? 'border-cyan-300 ring-1 ring-cyan-200' : 'border-slate-200',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'badge text-[10px] uppercase font-semibold px-2 py-0.5 border',
                          TIER_STYLES[plan.tier] || TIER_STYLES.FREE,
                        )}
                      >
                        {plan.tier}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200/50 rounded-full px-2 py-0.5">
                          Current Plan
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">{plan.name}</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {plan.priceInPaise === 0 ? 'Free' : formatCurrency(plan.priceInPaise / 100)}
                        {plan.priceInPaise > 0 && (
                          <span className="text-xs font-medium text-slate-400"> / {plan.billingCycle.toLowerCase()}</span>
                        )}
                      </p>
                      {isCurrent && currentSubscription?.currentPeriodStart && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          {formatDate(currentSubscription.currentPeriodStart)}
                          {currentSubscription?.currentPeriodEnd && (
                            <> &ndash; {formatDate(currentSubscription.currentPeriodEnd)}</>
                          )}
                        </p>
                      )}
                    </div>

                    <ul className="space-y-1.5 flex-1">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      disabled={isCurrent || checkoutMutation.isPending || (plan.tier !== 'FREE' && !razorpayReady)}
                      onClick={() => handleSelect(plan.id)}
                      className="btn-primary text-xs justify-center flex items-center gap-1.5"
                    >
                      {isSelecting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                      )}
                      {isCurrent ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
