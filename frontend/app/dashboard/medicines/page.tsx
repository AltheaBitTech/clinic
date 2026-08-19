'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalCatalogApi } from '@/lib/api';
import { 
  Pill, Plus, Search, Trash2, ChevronDown, 
  Loader2, Sparkles, AlertCircle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function MedicinesCatalogPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'MEDICINE' | 'OINTMENT'>('MEDICINE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [timing, setTiming] = useState('AFTER_FOOD');

  // Queries
  const { data: catalogItems, isLoading } = useQuery({
    queryKey: ['medical-catalog', activeTab],
    queryFn: () => medicalCatalogApi.getAll({ type: activeTab }).then((r) => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => medicalCatalogApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-catalog', activeTab] });
      toast.success(`${activeTab === 'MEDICINE' ? 'Medicine' : 'Ointment'} added to catalog!`);
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to add item';
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => medicalCatalogApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-catalog', activeTab] });
      toast.success('Catalog item removed');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to remove item';
      toast.error(msg);
    }
  });

  const openCreateModal = () => {
    setName('');
    setDosage('');
    setFrequency(activeTab === 'MEDICINE' ? 'Once daily' : 'As needed (PRN)');
    setTiming('AFTER_FOOD');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setName('');
    setDosage('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this item from the catalog?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      type: activeTab,
      dosage: dosage || undefined,
      frequency: frequency || undefined,
      timing: timing || undefined,
    });
  };

  const filteredItems = catalogItems?.filter((item: any) => {
    const n = item.name.toLowerCase();
    const d = (item.dosage || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return n.includes(q) || d.includes(q);
  }) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-5xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Pill className="w-6 h-6 text-cyan-600 animate-pulse shrink-0" />
            Medicines & Ointments Catalog
          </h1>
          <p className="page-subtitle">Define preconfigured medicines and topical ointments for faster autocompleted prescription writing.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add {activeTab === 'MEDICINE' ? 'Medicine' : 'Ointment'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => { setActiveTab('MEDICINE'); setSearchQuery(''); }}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'MEDICINE'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Pill className="w-4 h-4" /> Oral Medicines
        </button>
        <button
          onClick={() => { setActiveTab('OINTMENT'); setSearchQuery(''); }}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'OINTMENT'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Topical Ointments
        </button>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search catalog ${activeTab === 'MEDICINE' ? 'medicines' : 'ointments'} by name or dosage...`}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading catalogue...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Pill className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No {activeTab === 'MEDICINE' ? 'medicines' : 'ointments'} found in the catalogue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Dosage</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Frequency</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Timing</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Configured</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{item.dosage || 'None'}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{item.frequency || 'None'}</td>
                    <td className="py-3 px-4 text-xs">
                      {item.timing ? (
                        <span className="badge bg-cyan-50 text-cyan-700 text-[10px] font-bold">
                          {item.timing.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{formatDate(item.createdAt)}</td>
                    <td className="py-3 px-4 text-xs text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                        aria-label={`Delete ${item.name}`}
                        className="text-red-500 hover:text-red-650 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
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

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              Add {activeTab === 'MEDICINE' ? 'Medicine' : 'Ointment'} to Catalog
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={activeTab === 'MEDICINE' ? 'e.g. Paracetamol' : 'e.g. Betadine Ointment'}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Default Suggested Dosage (Optional)
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder={activeTab === 'MEDICINE' ? 'e.g. 500mg' : 'e.g. Apply twice daily'}
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Suggested Frequency
                  </label>
                  <div className="relative">
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="input appearance-none pr-10 text-xs"
                    >
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Thrice daily">Thrice daily</option>
                      <option value="Four times daily">Four times daily</option>
                      <option value="Before bed">Before bed</option>
                      <option value="Morning">Morning</option>
                      <option value="As needed (PRN)">As needed (PRN)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Suggested Timing
                  </label>
                  <div className="relative">
                    <select
                      value={timing}
                      onChange={(e) => setTiming(e.target.value)}
                      className="input appearance-none pr-10 text-xs"
                    >
                      <option value="AFTER_FOOD">After Food</option>
                      <option value="BEFORE_FOOD">Before Food</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !name.trim()}
                  className="btn-primary"
                >
                  {createMutation.isPending ? 'Saving...' : 'Add to Catalog'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
