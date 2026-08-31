import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clinic-jlq8.onrender.com/api/v1';
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

export const dashboardApi = {
  getSuperAdmin: () => api.get('/dashboard/super-admin'),
  getHospital: () => api.get('/dashboard/hospital'),
  getDoctor: () => api.get('/dashboard/doctor'),
  getPatient: () => api.get('/dashboard/patient'),
  getReceptionist: () => api.get('/dashboard/receptionist'),
};

export const billingApi = {
  createInvoice: (data: any) => api.post('/billing/invoices', data),
  getInvoices: (params?: any) => api.get('/billing/invoices', { params }),
  getOne: (id: string) => api.get(`/billing/invoices/${id}`),
  markPaid: (id: string) => api.put(`/billing/invoices/${id}/pay`),
  downloadInvoicePdf: (id: string) => api.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' }),
};

export const tenantRequestsApi = {
  create: (data: any) => api.post('/tenant-requests', data),
  getAll: () => api.get('/tenant-requests'),
  approve: (id: string) => api.post(`/tenant-requests/${id}/approve`),
  reject: (id: string) => api.post(`/tenant-requests/${id}/reject`),
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
};

export const pharmacyInventoryApi = {
  getBatches: () => api.get('/pharmacy/inventory'),
  getExpiry: (withinDays?: number) =>
    api.get('/pharmacy/inventory/expiry', { params: { withinDays } }),
  getLowStock: () => api.get('/pharmacy/inventory/low-stock'),
  getMovements: (params?: any) => api.get('/pharmacy/inventory/movements', { params }),
  createAdjustment: (data: any) => api.post('/pharmacy/inventory/adjustments', data),
  createBatch: (data: any) => api.post('/pharmacy/inventory/batches', data),
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
};

export const pharmacyReportsApi = {
  getSales: (params?: any) => api.get('/pharmacy/reports/sales', { params }),
  getPurchases: (params?: any) => api.get('/pharmacy/reports/purchases', { params }),
  getInventory: () => api.get('/pharmacy/reports/inventory'),
  getExpiry: (withinDays?: number) =>
    api.get('/pharmacy/reports/expiry', { params: { withinDays } }),
};


