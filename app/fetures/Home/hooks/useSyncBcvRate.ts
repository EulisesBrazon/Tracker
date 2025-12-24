import { useState } from 'react';

export function useSyncBcvRate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const sync = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/backend/bcv-rate-sync', { method: 'POST' });
      if (!res.ok) throw new Error('Error al sincronizar la tasa BCV');
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return { sync, loading, error, result };
}
