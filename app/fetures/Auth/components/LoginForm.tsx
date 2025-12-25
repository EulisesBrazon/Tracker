"use client";

import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) setError(res.error || 'Error al iniciar sesión');
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh] px-4 sm:px-0">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-4 rounded-lg border bg-card space-y-3">
        <h3 className="text-lg font-semibold">Iniciar sesión</h3>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 rounded bg-background border border-border text-foreground"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 rounded bg-background border border-border text-foreground"
          />
        </div>
        <div className="flex items-center justify-center">
          <div className="flex rounded-lg border border-border bg-muted/50 p-1">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-md bg-background text-foreground shadow-sm disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
