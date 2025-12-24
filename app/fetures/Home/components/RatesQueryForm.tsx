"use client"

import React, { useState } from 'react';
import { useQueryRates } from '../hooks/useQueryRates';

export function RatesQueryForm() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [source, setSource] = useState<'all' | 'bcv' | 'usdt'>('all');
  const { query, loading, error, results } = useQueryRates();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return; // hook handles errors
    await query({ from, to, source });
  };

  return (
    <form onSubmit={submit} className="p-4 bg-card rounded shadow-sm w-full max-w-xl">
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1">
          Desde
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="mt-1 w-full" />
        </label>
        <label className="flex-1">
          Hasta
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="mt-1 w-full" />
        </label>
        <label>
          Fuente
          <select value={source} onChange={e => setSource(e.target.value as any)} className="mt-1">
            <option value="all">Todas</option>
            <option value="bcv">BCV (oficial)</option>
            <option value="usdt">USDT (Binance)</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button type="submit" className="px-3 py-1 rounded bg-bcv text-white" disabled={loading}>
          {loading ? 'Consultando...' : 'Consultar'}
        </button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      <div className="mt-4">
        {results.bcv.length === 0 && results.usdt.length === 0 && !loading && (
          <div className="text-sm text-muted-foreground">No hay resultados</div>
        )}

        {results.bcv.length > 0 && (
          <div className="mb-3">
            <div className="text-sm font-semibold mb-1">BCV (Oficial)</div>
            {results.bcv.map((r, idx) => (
              <div key={`bcv-${idx}`} className="border-t pt-2 mt-2">
                <div className="text-sm font-medium">{r.nombre} — {r.fuenteId}</div>
                <div className="text-xs text-muted-foreground">Fecha: {r.fechaDia} — Últ: {new Date(r.ultimaActualizacion).toLocaleString()}</div>
                <div className="text-sm">Promedio: {r.promedio} — Valor actual: {r.valorActual}</div>
              </div>
            ))}
          </div>
        )}

        {results.usdt.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-1">USDT (Binance)</div>
            {results.usdt.map((r, idx) => (
              <div key={`usdt-${idx}`} className="border-t pt-2 mt-2">
                <div className="text-sm font-medium">{r.nombre} — {r.fuenteId}</div>
                <div className="text-xs text-muted-foreground">Fecha: {r.fechaDia} — Últ: {new Date(r.ultimaActualizacion).toLocaleString()}</div>
                <div className="text-sm">Promedio: {r.promedio} — Valor actual: {r.valorActual}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
