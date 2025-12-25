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
  // Start with null on both server and client first render to avoid hydration mismatches.
  const [user, setUser] = useState<User>(null);

  // After mount, load user from localStorage so client initial render matches server HTML.
  useEffect(() => {
    try {
      const s = localStorage.getItem('user');
      const parsed = s ? (JSON.parse(s) as User) : null;
      setUser(parsed);
    } catch {
      setUser(null);
    }
  }, []);

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

      // parse response safely (handle empty or non-json responses in production)
      let data: any = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (err) {
        return { ok: false, error: 'Respuesta inválida del servidor' };
      }

      if (!res.ok) return { ok: false, error: data?.message || 'Error de autenticación' };

      // store token if returned
      if (data?.token) {
        try {
          localStorage.setItem('token', data.token);
        } catch {}
      }

      setUser(data?.user ?? null);
      return { ok: true, token: data?.token };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  function logout() {
    try {
      localStorage.removeItem('token');
    } catch {}
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
