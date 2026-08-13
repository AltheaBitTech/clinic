'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '@/lib/api';
import { Package, Plus, Edit2, Trash2, CheckCircle2, X, Search, Loader2, Sparkles, Building2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Queries
  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll().then((r) => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => departmentsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created successfully!');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create department';
      toast.error(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => departmentsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated successfully!');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update department';
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to delete department';
      toast.error(msg);
    }
  });

  const openCreate = () => {
    closeModal();
    setIsModalOpen(true);
  };

  const openEdit = (dept: any) => {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description || '');
    setIsActive(dept.isActive);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    setName('');
    setDescription('');
    setIsActive(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Department name is required');
      return;
    }

    const payload = {
      name,
      description: description || undefined,
      isActive,
    };

    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredDepts = departments?.filter((d: any) => {
    return d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (d.description || '').toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-600 shrink-0" />
            Departments
          </h1>
          <p className="page-subtitle">Manage medical departments, centers of excellence, and active divisions.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add Department
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
            placeholder="Search departments by name or description..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Main Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-5 bg-slate-100 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-5/6" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="card text-center py-16">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">No departments found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map((d: any) => (
            <div key={d.id} className="card card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{d.name}</h3>
                  <span className={`badge text-[10px] ${
                    d.isActive 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {d.description ? (
                  <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">{d.description}</p>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-4">No description provided</p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-auto">
                <span className="text-[11px] text-slate-400 font-medium">
                  {d.doctors?.length || 0} Doctors registered
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(d)}
                    aria-label={`Edit ${d.name}`}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-cyan-600 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    aria-label={`Delete ${d.name}`}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              {editingDept ? 'Edit Department' : 'Create Department'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cardiology, Neurology, Pediatrics"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a brief summary of clinical services offered..."
                  className="input min-h-[100px] resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(true)}
                    className={`py-2 px-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isActive
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive(false)}
                    className={`py-2 px-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      !isActive
                        ? 'bg-slate-600 border-slate-600 text-white shadow-md shadow-slate-100'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
