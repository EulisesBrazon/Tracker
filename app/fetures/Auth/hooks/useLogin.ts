import { useState } from 'react';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; email?: string } | null>(null);

  async function login(username: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Error de autenticación');
        setLoading(false);
        return { ok: false, error: data?.message };
      }
      setToken(data.token);
      setUser(data.user);
      setLoading(false);
      return { ok: true, token: data.token, user: data.user };
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setLoading(false);
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  return { login, loading, error, token, user };
}

export default useLogin;
