'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from './api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  tenantId?: string;
  avatarUrl?: string;
  isVerified: boolean;
  doctor?: any;
  patient?: any;
  tenant?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await authApi.getProfile();
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    redirectByRole(data.user.role);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.clear();
    setUser(null);
    router.push('/login');
  };

  const register = async (data: any) => {
    const { data: result } = await authApi.register(data);
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    setUser(result.user);
    redirectByRole(result.user.role);
  };

  const redirectByRole = (role: string) => {
    const routes: Record<string, string> = {
      SUPER_ADMIN: '/dashboard/super-admin',
      HOSPITAL_ADMIN: '/dashboard/hospital',
      DOCTOR: '/dashboard/doctor',
      RECEPTIONIST: '/dashboard/receptionist',
      PATIENT: '/dashboard/patient',
    };
    router.push(routes[role] || '/dashboard/patient');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
