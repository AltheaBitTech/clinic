'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { pharmacySalesApi, pharmacyInventoryApi, pharmacyPatientsApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Receipt, Plus, Loader2, Sparkles, Search, Trash2, X, User, ChevronRight, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';

type CartItem = {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNo: string;
  expiryDate: string;
  availableQty: number;
  quantity: string;
  unitPrice: string;
  gstPercent: string;
};

type PaymentRow = {
  method: string;
  amount: string;
  referenceNo: string;
};

const paymentMethods = ['CASH', 'CARD', 'UPI', 'NETBANKING', 'WALLET', 'OTHER'];

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  REFUNDED: 'bg-indigo-50 text-indigo-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

const lineAmount = (c: CartItem) => (Number(c.unitPrice) || 0) * (Number(c.quantity) || 0);
const lineTax = (c: CartItem) => (lineAmount(c) * (Number(c.gstPercent) || 0)) / 100;

export default function PharmacySalesPage() {
  const [isPosOpen, setIsPosOpen] = useState(false);

  const { data: sales, isLoading } = useQuery({
    queryKey: ['pharmacy-sales'],
    queryFn: () => pharmacySalesApi.getAll().then((r) => r.data),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Receipt className="w-6 h-6 text-cyan-600 shrink-0" />
            Sales
          </h1>
          <p className="page-subtitle">Point of sale checkout, invoice history and customer returns.</p>
        </div>
        <button onClick={() => setIsPosOpen(true)} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> New Sale
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading sales...
          </div>
        ) : !sales || sales.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No sales recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice No.</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">{s.invoiceNo}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{s.patient?.name || 'Walk-in'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{s.items?.length ?? 0}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-800">{formatCurrency(s.total)}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className={`badge text-[10px] font-bold ${statusStyles[s.paymentStatus] || 'bg-slate-100 text-slate-600'}`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{formatDateTime(s.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/pharmacy-portal/sales/${s.id}`}
                        className="inline-flex items-center gap-1 text-cyan-600 hover:bg-cyan-50 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isPosOpen && <PosModal onClose={() => setIsPosOpen(false)} />}
    </div>
  );
}

function PosModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();

  // Customer
  const [patientId, setPatientId] = useState('');
  const [patientLabel, setPatientLabel] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Item picker
  const [itemSearch, setItemSearch] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Discount & payments
  const [discount, setDiscount] = useState('0');
  const [payments, setPayments] = useState<PaymentRow[]>([{ method: 'CASH', amount: '', referenceNo: '' }]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['pharmacy-patients-search', patientSearch],
    queryFn: () => pharmacyPatientsApi.getAll({ search: patientSearch }).then((r) => r.data),
    enabled: isPatientDropdownOpen,
  });

  const { data: batches } = useQuery({
    queryKey: ['pharmacy-inventory-batches'],
    queryFn: () => pharmacyInventoryApi.getBatches().then((r) => r.data),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (payload: any) => pharmacyPatientsApi.create(payload),
    onSuccess: (res) => {
      const p = res.data;
      setPatientId(p.id);
      setPatientLabel(`${p.name}${p.phone ? ` · ${p.phone}` : ''}`);
      setIsNewCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      toast.success('Customer added and selected');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add customer'),
  });

  const createSaleMutation = useMutation({
    mutationFn: (payload: any) => pharmacySalesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-sales'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-batches'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-low-stock'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-movements'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-dashboard-summary'] });
      toast.success('Sale completed');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to complete sale'),
    onSettled: () => setIsSubmitting(false),
  });

  const availableBatches = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    return (batches || []).filter((b: any) => {
      if (b.isExpired || b.status !== 'ACTIVE' || b.quantity <= 0) return false;
      if (!q) return true;
      return (
        (b.medicine?.name || '').toLowerCase().includes(q) ||
        (b.batchNo || '').toLowerCase().includes(q)
      );
    });
  }, [batches, itemSearch]);

  const addToCart = (batch: any) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.batchId === batch.id);
      if (idx >= 0) {
        const updated = [...prev];
        const nextQty = Math.min(Number(updated[idx].quantity) + 1, batch.quantity);
        updated[idx] = { ...updated[idx], quantity: String(nextQty) };
        return updated;
      }
      return [
        ...prev,
        {
          medicineId: batch.medicineId,
          medicineName: batch.medicine?.name || 'Unknown',
          batchId: batch.id,
          batchNo: batch.batchNo,
          expiryDate: batch.expiryDate,
          availableQty: batch.quantity,
          quantity: '1',
          unitPrice: String(batch.salePrice),
          gstPercent: batch.medicine?.gst != null ? String(batch.medicine.gst) : '0',
        },
      ];
    });
    setItemSearch('');
    setIsItemDropdownOpen(false);
  };

  const updateCartItem = (idx: number, field: keyof CartItem, value: string) => {
    setCart((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const removeCartItem = (idx: number) => setCart((prev) => prev.filter((_, i) => i !== idx));

  const addPaymentRow = () => setPayments((prev) => [...prev, { method: 'CASH', amount: '', referenceNo: '' }]);
  const removePaymentRow = (idx: number) => setPayments((prev) => prev.filter((_, i) => i !== idx));
  const updatePaymentRow = (idx: number, field: keyof PaymentRow, value: string) => {
    setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const subtotal = cart.reduce((sum, c) => sum + lineAmount(c), 0);
  const totalTax = cart.reduce((sum, c) => sum + lineTax(c), 0);
  const orderDiscount = Number(discount) || 0;
  const total = subtotal - orderDiscount + totalTax;
  const paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = total - paidAmount;

  const fillFullBalance = (idx: number) => {
    const remaining = total - (paidAmount - (Number(payments[idx].amount) || 0));
    updatePaymentRow(idx, 'amount', remaining > 0 ? remaining.toFixed(2) : '0');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Add at least one item to the cart');
      return;
    }
    for (const c of cart) {
      const qty = Number(c.quantity);
      if (!qty || qty <= 0) {
        toast.error(`Enter a valid quantity for ${c.medicineName}`);
        return;
      }
      if (qty > c.availableQty) {
        toast.error(`Only ${c.availableQty} units of ${c.medicineName} (batch ${c.batchNo}) are in stock`);
        return;
      }
      if (!c.unitPrice || Number(c.unitPrice) <= 0) {
        toast.error(`Enter a valid price for ${c.medicineName}`);
        return;
      }
    }
    const validPayments = payments.filter((p) => p.method && Number(p.amount) > 0);
    if (validPayments.length === 0) {
      toast.error('Add at least one payment with an amount');
      return;
    }

    setIsSubmitting(true);
    createSaleMutation.mutate({
      patientId: patientId || undefined,
      discount: orderDiscount,
      items: cart.map((c) => ({
        medicineId: c.medicineId,
        batchId: c.batchId,
        quantity: Number(c.quantity),
        unitPrice: Number(c.unitPrice),
        tax: Number(lineTax(c).toFixed(2)),
      })),
      payments: validPayments.map((p) => ({
        method: p.method,
        amount: Number(p.amount),
        referenceNo: p.referenceNo.trim() || undefined,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-600" />
          New Sale (POS)
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 max-w-5xl w-full mx-auto">
          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Customer (optional)</label>
            {isNewCustomer ? (
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <input type="text" placeholder="Name *" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} className="input text-sm" />
                <input type="text" placeholder="Phone" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} className="input text-sm" />
                <input type="email" placeholder="Email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} className="input text-sm" />
                <div className="col-span-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsNewCustomer(false)} className="btn-secondary text-xs px-3 py-1.5">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={createCustomerMutation.isPending}
                    onClick={() => {
                      if (!newCustName.trim()) {
                        toast.error('Customer name is required');
                        return;
                      }
                      createCustomerMutation.mutate({
                        name: newCustName.trim(),
                        phone: newCustPhone.trim() || undefined,
                        email: newCustEmail.trim() || undefined,
                      });
                    }}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    {createCustomerMutation.isPending ? 'Adding...' : 'Add & Select'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={patientId ? patientLabel : patientSearch}
                    onFocus={() => {
                      setIsPatientDropdownOpen(true);
                      if (patientId) {
                        setPatientId('');
                        setPatientLabel('');
                      }
                    }}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setIsPatientDropdownOpen(true);
                    }}
                    placeholder="Search customer by name or phone, or leave blank for walk-in..."
                    className="input pl-10 pr-24"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsPatientDropdownOpen(false);
                      setIsNewCustomer(true);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-600 hover:text-cyan-700 bg-cyan-50/50 hover:bg-cyan-50 px-2 py-1 rounded-md transition-colors"
                  >
                    + New
                  </button>
                </div>
                {isPatientDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {isLoadingPatients ? (
                      <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" /> Searching...
                      </div>
                    ) : patients?.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No customers found. Use &ldquo;+ New&rdquo; to add one.</div>
                    ) : (
                      (patients || []).map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPatientId(p.id);
                            setPatientLabel(`${p.name}${p.phone ? ` · ${p.phone}` : ''}`);
                            setIsPatientDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 p-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="text-left">
                            <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                            <p className="text-[11px] text-slate-400">{p.phone || p.email || '—'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {isPatientDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsPatientDropdownOpen(false)} />}
              </div>
            )}
          </div>

          {/* Item picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Add Items</label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={itemSearch}
                  onFocus={() => setIsItemDropdownOpen(true)}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setIsItemDropdownOpen(true);
                  }}
                  placeholder="Search medicine to add to cart..."
                  className="input pl-10"
                />
              </div>
              {isItemDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-50">
                  {availableBatches.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">No in-stock batches match your search.</div>
                  ) : (
                    availableBatches.slice(0, 20).map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() => addToCart(b)}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-800">{b.medicine?.name}</p>
                          <p className="text-[11px] text-slate-400">
                            Batch {b.batchNo} · {b.quantity} in stock
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg shrink-0">
                          {formatCurrency(b.salePrice)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
              {isItemDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsItemDropdownOpen(false)} />}
            </div>
          </div>

          {/* Cart */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cart</label>
            {cart.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-400">
                No items added yet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicine</th>
                      <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch</th>
                      <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                      <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                      <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">GST %</th>
                      <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((c, idx) => (
                      <tr key={c.batchId} className="border-b border-slate-50 last:border-none">
                        <td className="py-2 px-3 text-xs font-semibold text-slate-800">{c.medicineName}</td>
                        <td className="py-2 px-3 text-xs text-slate-500">{c.batchNo}</td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min={1}
                            max={c.availableQty}
                            value={c.quantity}
                            onChange={(e) => updateCartItem(idx, 'quantity', e.target.value)}
                            className="input text-xs py-1.5 px-2 w-16"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={c.unitPrice}
                            onChange={(e) => updateCartItem(idx, 'unitPrice', e.target.value)}
                            className="input text-xs py-1.5 px-2 w-20"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={c.gstPercent}
                            onChange={(e) => updateCartItem(idx, 'gstPercent', e.target.value)}
                            className="input text-xs py-1.5 px-2 w-16"
                          />
                        </td>
                        <td className="py-2 px-3 text-xs font-semibold text-slate-700">{formatCurrency(lineAmount(c) + lineTax(c))}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeCartItem(idx)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Payments</label>
              <button type="button" onClick={addPaymentRow} className="text-xs font-semibold text-cyan-600 hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Payment
              </button>
            </div>
            <div className="space-y-2">
              {payments.map((p, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="relative col-span-3">
                    <select
                      value={p.method}
                      onChange={(e) => updatePaymentRow(idx, 'method', e.target.value)}
                      className="input text-xs py-1.5 appearance-none"
                    >
                      {paymentMethods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Amount"
                    value={p.amount}
                    onChange={(e) => updatePaymentRow(idx, 'amount', e.target.value)}
                    className="input text-xs py-1.5 col-span-3"
                  />
                  <input
                    type="text"
                    placeholder="Reference No. (optional)"
                    value={p.referenceNo}
                    onChange={(e) => updatePaymentRow(idx, 'referenceNo', e.target.value)}
                    className="input text-xs py-1.5 col-span-4"
                  />
                  <button
                    type="button"
                    onClick={() => fillFullBalance(idx)}
                    className="col-span-1 text-[10px] font-semibold text-cyan-600 hover:underline whitespace-nowrap"
                  >
                    Full
                  </button>
                  <button
                    type="button"
                    onClick={() => removePaymentRow(idx)}
                    disabled={payments.length === 1}
                    className="col-span-1 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer disabled:opacity-30 justify-self-end"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 shrink-0">Overall Discount</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="input text-xs py-1.5 w-28 text-right"
                />
              </div>
              <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
              <SummaryRow label="GST / Tax" value={formatCurrency(totalTax)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">Total</span>
                <span className="text-lg font-extrabold text-cyan-700">{formatCurrency(total)}</span>
              </div>
              <SummaryRow label="Amount Received" value={formatCurrency(paidAmount)} />
              <SummaryRow
                label={balanceDue > 0 ? 'Balance Due' : 'Change / Credit'}
                value={formatCurrency(Math.abs(balanceDue))}
                emphasis={balanceDue > 0}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex justify-end gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 max-w-5xl w-full mx-auto">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            {isSubmitting ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SummaryRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${emphasis ? 'font-semibold text-amber-600' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-xs ${emphasis ? 'font-bold text-amber-700' : 'font-semibold text-slate-600'}`}>{value}</span>
    </div>
  );
}
