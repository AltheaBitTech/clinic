import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clinic-jlq8.onrender.com/api/v1';
console.log('API_URL:', API_URL);
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// ─── API Helpers ──────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  sendRegisterEmailOtp: (data: { email: string; firstName?: string }) =>
    api.post('/auth/register/send-email-otp', data),
  verifyRegisterEmailOtp: (data: { email: string; otp: string }) =>
    api.post('/auth/register/verify-email-otp', data),
  login: (data: any) => api.post('/auth/login', data),
  sendOtp: (phone: string) => api.post('/auth/otp/send', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/otp/verify', { phone, otp }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  acceptInvite: (data: any) => api.post('/auth/invite/accept', data),
};

export const tenantsApi = {
  create: (data: any) => api.post('/tenants', data),
  getAll: (params?: any) => api.get('/tenants', { params }),
  getPublic: (search?: string) => api.get('/tenants/public', { params: { search } }),
  getMy: () => api.get('/tenants/my'),
  getMyStats: () => api.get('/tenants/my/stats'),
  getMyAnalytics: () => api.get('/tenants/my/analytics'),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  invite: (id: string, data: any) => api.post(`/tenants/${id}/invite`, data),
  uploadLogo: (id: string, formData: FormData) => api.post(`/tenants/${id}/logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const subscriptionApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/me'),
  checkout: (planId: string) => api.post('/subscriptions/checkout', { planId }),
  cancel: (id: string) => api.post(`/subscriptions/${id}/cancel`),
};

export const patientsApi = {
  create: (data: any) => api.post('/patients', data),
  getAll: (params?: any) => api.get('/patients', { params }),
  getOne: (id: string) => api.get(`/patients/${id}`),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
  getMe: () => api.get('/patients/me'),
  addFamilyMember: (id: string, data: any) => api.post(`/patients/${id}/family-members`, data),
  getTimeline: (id: string, params?: any) => api.get(`/patients/${id}/timeline`, { params }),
};

export const doctorsApi = {
  create: (data: any) => api.post('/doctors', data),
  getAll: (params?: any) => api.get('/doctors', { params }),
  getOne: (id: string) => api.get(`/doctors/${id}`),
  update: (id: string, data: any) => api.put(`/doctors/${id}`, data),
  getSlots: (id: string, date: string) => api.get(`/doctors/${id}/slots`, { params: { date } }),
};

export const departmentsApi = {
  create: (data: any) => api.post('/departments', data),
  getAll: () => api.get('/departments'),
  update: (id: string, data: any) => api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

export const appointmentsApi = {
  create: (data: any) => api.post('/appointments', data),
  getAll: (params?: any) => api.get('/appointments', { params }),
  getOne: (id: string) => api.get(`/appointments/${id}`),
  update: (id: string, data: any) => api.put(`/appointments/${id}`, data),
  getToday: () => api.get('/appointments/today'),
  getMissedFollowUps: () => api.get('/appointments/missed-followups'),
  notifyFollowUp: (id: string) => api.post(`/appointments/${id}/notify-followup`),
};

export const prescriptionsApi = {
  create: (data: any) => api.post('/prescriptions', data),
  getAll: (params?: any) => api.get('/prescriptions', { params }),
  getOne: (id: string) => api.get(`/prescriptions/${id}`),
};

export const reportsApi = {
  upload: (formData: FormData) => api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params?: any) => api.get('/reports', { params }),
  getOne: (id: string) => api.get(`/reports/${id}`),
  delete: (id: string) => api.delete(`/reports/${id}`),
};

export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const chatApi = {
  getOrCreateRoom: (data: any) => api.post('/chat/rooms', data),
  getRooms: () => api.get('/chat/rooms'),
  getMessages: (roomId: string, params?: any) => api.get(`/chat/rooms/${roomId}/messages`, { params }),
};

export const analyticsApi = {
  getRevenueOverview: () => api.get('/analytics/revenue'),
};

export const hospitalReportsApi = {
  run: (type: string, params?: any) => api.get(`/hospital-reports/${type}`, { params }),
  export: (type: string, params?: any) =>
    api.get(`/hospital-reports/${type}/export`, { params, responseType: 'blob' }),
};

export const dashboardApi = {
  getSuperAdmin: () => api.get('/dashboard/super-admin'),
  getHospital: () => api.get('/dashboard/hospital'),
  getDoctor: () => api.get('/dashboard/doctor'),
  getPatient: () => api.get('/dashboard/patient'),
  getReceptionist: () => api.get('/dashboard/receptionist'),
  getReferral: () => api.get('/dashboard/referral'),
};

export const billingApi = {
  createInvoice: (data: any) => api.post('/billing/invoices', data),
  getInvoices: (params?: any) => api.get('/billing/invoices', { params }),
  getOne: (id: string) => api.get(`/billing/invoices/${id}`),
  markPaid: (id: string) => api.put(`/billing/invoices/${id}/pay`),
  createPaymentOrder: (id: string) => api.post(`/billing/invoices/${id}/create-payment-order`),
  verifyPayment: (id: string, data: any) => api.post(`/billing/invoices/${id}/verify-payment`, data),
  downloadInvoicePdf: (id: string) => api.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' }),
  exportInvoices: (params?: any) =>
    api.get('/billing/invoices/export', { params, responseType: 'blob' }),
};

export const tenantRequestsApi = {
  create: (data: any) => api.post('/tenant-requests', data),
  getAll: () => api.get('/tenant-requests'),
  approve: (id: string) => api.post(`/tenant-requests/${id}/approve`),
  reject: (id: string) => api.post(`/tenant-requests/${id}/reject`),
};

export const referralApi = {
  register: (data: any) => api.post('/referrals/register', data),
  getAll: (status?: string) => api.get('/referrals', { params: { status } }),
  approve: (id: string) => api.post(`/referrals/${id}/approve`),
  reject: (id: string) => api.post(`/referrals/${id}/reject`),
  getMe: () => api.get('/referrals/me'),
  updateMe: (data: any) => api.patch('/referrals/me', data),
  getMyReferredTenants: (type?: 'HOSPITAL' | 'PHARMACY') =>
    api.get('/referrals/me/referred-tenants', { params: { type } }),
  submitKyc: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/referrals/me/kyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMyKyc: () => api.get('/referrals/me/kyc'),
  getKycRequests: (status?: string) => api.get('/referrals/kyc-requests', { params: { status } }),
  approveKyc: (id: string) => api.post(`/referrals/${id}/kyc/approve`),
  rejectKyc: (id: string, reason?: string) => api.post(`/referrals/${id}/kyc/reject`, { reason }),
  updateCommission: (id: string, commissionPercent: number) =>
    api.patch(`/referrals/${id}/commission`, { commissionPercent }),
  getCommissions: (id: string) => api.get(`/referrals/${id}/commissions`),
  getPendingPayouts: () => api.get('/referrals/pending-payouts'),
  getEarningsSummary: (id: string) => api.get(`/referrals/${id}/earnings-summary`),
  recordPayout: (id: string, data: any) => api.post(`/referrals/${id}/payouts`, data),
  getPayouts: (id: string) => api.get(`/referrals/${id}/payouts`),
  getMyEarningsSummary: () => api.get('/referrals/me/earnings-summary'),
  getMyPayouts: () => api.get('/referrals/me/payouts'),
};

export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getPlatform: (params?: any) => api.get('/users/platform', { params }),
  updateProfile: (data: any) => api.put('/users/profile', data),
  toggleActive: (id: string) => api.put(`/users/${id}/toggle-active`),
  uploadAvatar: (formData: FormData) => api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const medicalCatalogApi = {
  create: (data: any) => api.post('/medical-catalog', data),
  getAll: (params?: any) => api.get('/medical-catalog', { params }),
  delete: (id: string) => api.delete(`/medical-catalog/${id}`),
};

export const pharmaciesApi = {
  create: (data: any) => api.post('/pharmacies', data),
  getAll: (params?: any) => api.get('/pharmacies', { params }),
  getOne: (id: string) => api.get(`/pharmacies/${id}`),
  update: (id: string, data: any) => api.put(`/pharmacies/${id}`, data),
  remove: (id: string) => api.delete(`/pharmacies/${id}`),
  createInvite: () => api.post('/pharmacies/invite'),
  getInvite: (token: string) => api.get(`/pharmacies/invite/${token}`),
  completeInvite: (token: string, data: any) =>
    api.post(`/pharmacies/invite/${token}/complete`, data),
  getMine: () => api.get('/pharmacies/me'),
  updateMine: (data: any) => api.put('/pharmacies/me', data),
};

export const pharmacyDashboardApi = {
  getSummary: () => api.get('/pharmacy/dashboard'),
};

export const pharmacyMedicinesApi = {
  create: (data: any) => api.post('/pharmacy/medicines', data),
  getAll: (params?: any) => api.get('/pharmacy/medicines', { params }),
  getOne: (id: string) => api.get(`/pharmacy/medicines/${id}`),
  update: (id: string, data: any) => api.patch(`/pharmacy/medicines/${id}`, data),
  getPriceHistory: (id: string) => api.get(`/pharmacy/medicines/${id}/price-history`),
};

export const pharmacyInventoryApi = {
  getBatches: () => api.get('/pharmacy/inventory'),
  getExpiry: (withinDays?: number) =>
    api.get('/pharmacy/inventory/expiry', { params: { withinDays } }),
  getLowStock: () => api.get('/pharmacy/inventory/low-stock'),
  getMovements: (params?: any) => api.get('/pharmacy/inventory/movements', { params }),
  createAdjustment: (data: any) => api.post('/pharmacy/inventory/adjustments', data),
  createBatch: (data: any) => api.post('/pharmacy/inventory/batches', data),
  updateBatch: (id: string, data: any) => api.patch(`/pharmacy/inventory/batches/${id}`, data),
};

export const pharmacySuppliersApi = {
  create: (data: any) => api.post('/pharmacy/suppliers', data),
  getAll: (params?: any) => api.get('/pharmacy/suppliers', { params }),
  getOne: (id: string) => api.get(`/pharmacy/suppliers/${id}`),
  update: (id: string, data: any) => api.patch(`/pharmacy/suppliers/${id}`, data),
};

export const pharmacyPurchasesApi = {
  create: (data: any) => api.post('/pharmacy/purchases', data),
  getAll: () => api.get('/pharmacy/purchases'),
  getOne: (id: string) => api.get(`/pharmacy/purchases/${id}`),
  receive: (id: string, data: any) => api.post(`/pharmacy/purchases/${id}/receive`, data),
  downloadPdf: (id: string) => api.get(`/pharmacy/purchases/${id}/pdf`, { responseType: 'blob' }),
  emailToSupplier: (id: string, email?: string) =>
    api.post(`/pharmacy/purchases/${id}/email`, email ? { email } : {}),
  publicPdfUrl: (id: string) => `${API_URL}/pharmacy/purchases/${id}/pdf/public`,
};

export const pharmacyPatientsApi = {
  create: (data: any) => api.post('/pharmacy/patients', data),
  getAll: (params?: any) => api.get('/pharmacy/patients', { params }),
  getOne: (id: string) => api.get(`/pharmacy/patients/${id}`),
};

export const pharmacyPrescriptionsApi = {
  create: (data: any) => api.post('/pharmacy/prescriptions', data),
  getAll: (params?: any) => api.get('/pharmacy/prescriptions', { params }),
  getOne: (id: string) => api.get(`/pharmacy/prescriptions/${id}`),
  verify: (id: string) => api.post(`/pharmacy/prescriptions/${id}/verify`),
  dispense: (id: string, data: any) => api.post(`/pharmacy/prescriptions/${id}/dispense`, data),
};

export const pharmacySalesApi = {
  create: (data: any) => api.post('/pharmacy/sales', data),
  getAll: () => api.get('/pharmacy/sales'),
  getOne: (id: string) => api.get(`/pharmacy/sales/${id}`),
  createReturn: (id: string, data: any) => api.post(`/pharmacy/sales/${id}/return`, data),
  cancel: (id: string, data: any) => api.post(`/pharmacy/sales/${id}/cancel`, data),
  pay: (id: string, data: any) => api.post(`/pharmacy/sales/${id}/pay`, data),
};

export const pharmacyReportsApi = {
  getSales: (params?: any) => api.get('/pharmacy/reports/sales', { params }),
  exportSales: (params?: any) =>
    api.get('/pharmacy/reports/sales/export', { params, responseType: 'blob' }),
  getPurchases: (params?: any) => api.get('/pharmacy/reports/purchases', { params }),
  exportPurchases: (params?: any) =>
    api.get('/pharmacy/reports/purchases/export', { params, responseType: 'blob' }),
  getSupplierHistorySummary: () => api.get('/pharmacy/reports/suppliers-history'),
  getSupplierHistory: (supplierId: string) =>
    api.get(`/pharmacy/reports/suppliers/${supplierId}/history`),
  exportSupplierHistory: (supplierId: string, params?: any) =>
    api.get(`/pharmacy/reports/suppliers/${supplierId}/history/export`, {
      params,
      responseType: 'blob',
    }),
  getInventory: () => api.get('/pharmacy/reports/inventory'),
  getExpiry: (withinDays?: number) =>
    api.get('/pharmacy/reports/expiry', { params: { withinDays } }),
};

export const pathologyLabsApi = {
  getAll: (search?: string) => api.get('/pathology-labs', { params: { search } }),
  getOne: (id: string) => api.get(`/pathology-labs/${id}`),
  createInvite: (data?: { email?: string }) => api.post('/pathology-labs/invite', data),
  getInvite: (token: string) => api.get(`/pathology-labs/invite/${token}`),
  completeInvite: (token: string, data: any) =>
    api.post(`/pathology-labs/invite/${token}/complete`, data),
  getMine: () => api.get('/pathology-labs/me'),
  updateMine: (data: any) => api.put('/pathology-labs/me', data),
};

export const hospitalLabLinksApi = {
  request: (data: { labId: string; notes?: string }) => api.post('/hospital-lab-links', data),
  getForHospital: () => api.get('/hospital-lab-links'),
  getIncoming: () => api.get('/hospital-lab-links/incoming'),
  approve: (id: string) => api.put(`/hospital-lab-links/${id}/approve`),
  reject: (id: string) => api.put(`/hospital-lab-links/${id}/reject`),
  revoke: (id: string) => api.put(`/hospital-lab-links/${id}/revoke`),
};

export const pathologyCatalogApi = {
  create: (data: any) => api.post('/pathology/tests', data),
  getAll: (search?: string) => api.get('/pathology/tests', { params: { search } }),
  getOne: (id: string) => api.get(`/pathology/tests/${id}`),
  update: (id: string, data: any) => api.patch(`/pathology/tests/${id}`, data),
};

export const pathologyMasterTestsApi = {
  getAll: (params?: { search?: string; category?: string; department?: string; limit?: number }) =>
    api.get('/pathology/master-tests', { params }),
  getOne: (id: string) => api.get(`/pathology/master-tests/${id}`),
};

export const pathologyOrdersApi = {
  createForHospital: (data: any) => api.post('/pathology-orders/hospital', data),
  createWalkIn: (data: any) => api.post('/pathology-orders', data),
  getAll: (params?: any) => api.get('/pathology-orders', { params }),
  getOne: (id: string) => api.get(`/pathology-orders/${id}`),
  scheduleCollection: (id: string, data: any) =>
    api.put(`/pathology-orders/${id}/schedule-collection`, data),
  markCollected: (id: string, data?: { sampleType?: string; container?: string; notes?: string }) =>
    api.put(`/pathology-orders/${id}/mark-collected`, data),
  receive: (id: string) => api.put(`/pathology-orders/${id}/receive`),
  acceptSample: (id: string) => api.put(`/pathology-orders/${id}/accept-sample`),
  rejectSample: (id: string, data: { rejectionReason: string; rejectionNotes?: string }) =>
    api.put(`/pathology-orders/${id}/reject-sample`, data),
  requestRecollection: (id: string) => api.put(`/pathology-orders/${id}/request-recollection`),
  startProcessing: (id: string) => api.put(`/pathology-orders/${id}/start-processing`),
  cancel: (id: string, data?: { cancelReason?: string }) =>
    api.put(`/pathology-orders/${id}/cancel`, data),
};

export const pathologyCollectorsApi = {
  create: (data: any) => api.post('/pathology-orders/collectors', data),
  getAll: () => api.get('/pathology-orders/collectors'),
  update: (id: string, data: any) => api.put(`/pathology-orders/collectors/${id}`, data),
};

export const pathologyResultsApi = {
  enter: (orderItemId: string, data: { results: any[] }) =>
    api.post(`/pathology-orders/${orderItemId}/results`, data),
  notifyCritical: (resultValueId: string) =>
    api.put(`/pathology-orders/results/${resultValueId}/notify-critical`),
  acknowledgeCritical: (resultValueId: string, data?: { notes?: string; escalated?: boolean }) =>
    api.put(`/pathology-orders/results/${resultValueId}/acknowledge-critical`, data),
  submitForVerification: (orderId: string) =>
    api.put(`/pathology-orders/${orderId}/submit-for-verification`),
  verify: (orderId: string) => api.put(`/pathology-orders/${orderId}/verify`),
  deliver: (orderId: string) => api.put(`/pathology-orders/${orderId}/deliver`),
  amend: (orderId: string, data: { reason: string }) =>
    api.put(`/pathology-orders/${orderId}/amend`, data),
};

export const pathologyDashboardApi = {
  getSummary: () => api.get('/pathology-dashboard/summary'),
  getPendingByDepartment: () => api.get('/pathology-dashboard/pending-by-department'),
};

export const pathologyReportsApi = {
  getRevenue: (params?: { from?: string; to?: string }) =>
    api.get('/pathology-reports/revenue', { params }),
  getTat: (params?: { from?: string; to?: string }) =>
    api.get('/pathology-reports/tat', { params }),
  getCommissions: (params?: { doctorId?: string; from?: string; to?: string }) =>
    api.get('/pathology-reports/commissions', { params }),
};


