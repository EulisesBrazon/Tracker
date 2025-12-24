"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type User = { email: string; name?: string } | null;

interface AuthContextType {
  user: User;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) as User : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  async function login(email: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) return { ok: false, error: data?.message || 'Error de autenticación' };

      // store token if returned
      if (data.token) {
        try {
          localStorage.setItem('token', data.token);
        } catch {}
      }

      setUser(data.user ?? null);
      return { ok: true, token: data.token };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  function logout() {
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthProvider;
