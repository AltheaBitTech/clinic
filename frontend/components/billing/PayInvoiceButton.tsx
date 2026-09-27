'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2, Smartphone, Landmark, Wallet, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { billingApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI', description: 'Pay via any UPI app', icon: Smartphone, razorpayMethod: 'upi' },
  { value: 'CARD', label: 'Credit/Debit Card', description: 'Visa, Mastercard, RuPay & more', icon: CreditCard, razorpayMethod: 'card' },
  { value: 'NETBANKING', label: 'Net Banking', description: 'Pay directly from your bank', icon: Landmark, razorpayMethod: 'netbanking' },
  { value: 'WALLET', label: 'Wallets', description: 'Paytm, Mobikwik & more', icon: Wallet, razorpayMethod: 'wallet' },
] as const;

type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]['value'];

export function PayInvoiceButton({
  invoiceId,
  amount,
  className,
  label = 'Pay Invoice Online',
}: {
  invoiceId: string;
  amount: number;
  className?: string;
  label?: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodValue>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStuckHelp, setShowStuckHelp] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const invalidateInvoices = () => {
    qc.invalidateQueries({ queryKey: ['invoices'] });
    qc.invalidateQueries({ queryKey: ['appointment'] });
    qc.invalidateQueries({ queryKey: ['dashboard', 'patient'] });
  };

  const stopWatchingPayment = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (stuckTimerRef.current) {
      clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = null;
    }
    setShowStuckHelp(false);
  };

  // Razorpay's client-side `handler` callback only fires if the browser tab
  // is still around when the payment finishes — a UPI app-switch on mobile
  // can leave it stranded (paid in the UPI app, but the tab never resumes).
  // Poll the invoice in the background so we notice a PAID invoice from the
  // webhook even if that callback never comes back.
  const watchForPayment = () => {
    stopWatchingPayment();
    pollRef.current = setInterval(async () => {
      try {
        const { data: invoice } = await billingApi.getOne(invoiceId);
        if (invoice.status === 'PAID') {
          stopWatchingPayment();
          toast.success('Payment successful!');
          invalidateInvoices();
          setIsProcessing(false);
          setOpen(false);
        }
      } catch {
        // transient network error — keep polling, next tick may succeed
      }
    }, 3000);
    stuckTimerRef.current = setTimeout(() => setShowStuckHelp(true), 12000);
  };

  const checkStatusNow = async () => {
    try {
      const { data: invoice } = await billingApi.getOne(invoiceId);
      if (invoice.status === 'PAID') {
        stopWatchingPayment();
        toast.success('Payment successful!');
        invalidateInvoices();
        setIsProcessing(false);
        setOpen(false);
      } else {
        toast('No payment received yet for this invoice');
      }
    } catch {
      toast.error('Could not check payment status — please try again');
    }
  };

  const giveUpWaiting = () => {
    stopWatchingPayment();
    setIsProcessing(false);
  };

  useEffect(() => stopWatchingPayment, []);

  const verifyMutation = useMutation({
    mutationFn: (payload: any) => billingApi.verifyPayment(invoiceId, payload),
    onSuccess: () => {
      toast.success('Payment successful!');
      invalidateInvoices();
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Payment verification failed — please contact support if any amount was deducted');
    },
    onSettled: () => {
      stopWatchingPayment();
      setIsProcessing(false);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: () => billingApi.createPaymentOrder(invoiceId).then((r) => r.data),
    onSuccess: (order) => {
      if (!window.Razorpay) {
        toast.error('Payment gateway is still loading — please try again in a moment');
        setIsProcessing(false);
        return;
      }
      const method = PAYMENT_METHODS.find((m) => m.value === selectedMethod);
      const rzp = new window.Razorpay({
        key: order.razorpayKeyId,
        order_id: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Arogyix',
        description: `Invoice ${order.invoiceNo}`,
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email,
          contact: user?.phone,
          method: method?.razorpayMethod,
        },
        theme: { color: '#0891b2' },
        handler: (response: any) => {
          stopWatchingPayment();
          verifyMutation.mutate({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            paymentMethod: selectedMethod,
          });
        },
        modal: {
          ondismiss: () => {
            // Don't assume cancellation: on mobile this also fires when a UPI
            // app-switch fails to hand control back to the checkout widget,
            // even though the payment may have gone through. Keep polling the
            // invoice for a bit before giving up.
            toast('Waiting for payment confirmation...');
            watchForPayment();
          },
        },
      });
      rzp.open();
      watchForPayment();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start payment');
      setIsProcessing(false);
    },
  });

  const handleProceed = () => {
    setIsProcessing(true);
    createOrderMutation.mutate();
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onReady={() => setRazorpayReady(true)}
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-1.5',
          className,
        )}
      >
        <CreditCard className="w-4 h-4" />
        {label}
      </button>

      <Dialog open={open} onOpenChange={(next) => !isProcessing && setOpen(next)}>
        <DialogContent className="max-w-md">
          <DialogTitle>
            <CreditCard className="w-5 h-5 text-cyan-600" />
            Choose a payment method
          </DialogTitle>

          <p className="text-sm text-slate-500 mb-4">
            Amount payable: <span className="font-bold text-slate-800">{formatCurrency(amount)}</span>
          </p>

          <div className="space-y-2 mb-5">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.value;
              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setSelectedMethod(method.value)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                    isSelected
                      ? 'border-cyan-400 bg-cyan-50/60 ring-1 ring-cyan-200'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{method.label}</p>
                    <p className="text-xs text-slate-500">{method.description}</p>
                  </div>
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 shrink-0',
                      isSelected ? 'border-cyan-600 bg-cyan-600' : 'border-slate-300',
                    )}
                  />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleProceed}
            disabled={isProcessing || !razorpayReady}
            className="btn-primary w-full text-sm justify-center flex items-center gap-1.5"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {razorpayReady ? 'Proceed to Payment' : 'Loading payment gateway...'}
          </button>

          {showStuckHelp && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="text-amber-800 font-medium">Still waiting for payment confirmation</p>
              <p className="text-amber-700 text-xs mt-1">
                If you completed the payment in your UPI app but this screen didn&apos;t update, check the status below.
              </p>
              <div className="flex gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={checkStatusNow}
                  className="flex-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-2"
                >
                  Check payment status
                </button>
                <button
                  type="button"
                  onClick={giveUpWaiting}
                  className="flex-1 text-xs font-semibold border border-amber-300 text-amber-800 rounded-lg py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
