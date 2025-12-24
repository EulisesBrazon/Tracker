import { useState } from 'react';

export function useQueryRates() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ bcv: any[]; usdt: any[] }>({ bcv: [], usdt: [] });

  const query = async (opts: { from: string; to: string; source?: string }) => {
    setLoading(true);
    setError(null);
    setResults({ bcv: [], usdt: [] });
    try {
      const params = new URLSearchParams({ from: opts.from, to: opts.to });
      if (opts.source && opts.source !== 'all') params.append('source', opts.source);
      const res = await fetch(`/api/rates?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      if (!payload.success) throw new Error(payload.error || 'Error en respuesta');
      const data = payload.data || { bcv: [], usdt: [] };
      // normalize if backend returns array (backwards compatibility)
      if (Array.isArray(data)) {
        const bcv = data.filter((r: any) => r.fuenteId === 'bcv_oficial');
        const usdt = data.filter((r: any) => r.fuenteId === 'binance_usdt');
        setResults({ bcv, usdt });
        return { bcv, usdt };
      }
      setResults({ bcv: data.bcv || [], usdt: data.usdt || [] });
      return { bcv: data.bcv || [], usdt: data.usdt || [] };
    } catch (err: any) {
      setError(err?.message || 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { query, loading, error, results };
}
