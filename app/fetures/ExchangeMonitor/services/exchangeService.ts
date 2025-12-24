import { DateRange, ExchangeRate } from '../types';

type RateSummary = {
  fuenteId: string;
  fechaDia: string;
  valorActual: number;
  promedio: number;
  ultimaActualizacion: string;
};

type RatesApiResponse = {
  success: boolean;
  data:
    | {
        bcv: RateSummary[];
        usdt: RateSummary[];
      }
    | RateSummary[];
  error?: string;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRangeDates(range: DateRange) {
  const to = new Date();
  const from = new Date(to);

  switch (range) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      break;
    case '7d':
      from.setDate(to.getDate() - 7);
      break;
    case '30d':
      from.setDate(to.getDate() - 30);
      break;
    case 'ytd':
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      break;
    default:
      from.setDate(to.getDate() - 7);
  }

  return { from: formatDate(from), to: formatDate(to) };
}

function mergeRates(grouped: { bcv: RateSummary[]; usdt: RateSummary[] }): ExchangeRate[] {
  const map = new Map<string, { fecha: string; bcv?: number; paralelo?: number }>();

  grouped.bcv.forEach(item => {
    const entry = map.get(item.fechaDia) || { fecha: item.fechaDia };
    entry.bcv = item.valorActual ?? item.promedio;
    map.set(item.fechaDia, entry);
  });

  grouped.usdt.forEach(item => {
    const entry = map.get(item.fechaDia) || { fecha: item.fechaDia };
    entry.paralelo = item.valorActual ?? item.promedio;
    map.set(item.fechaDia, entry);
  });

  return Array.from(map.values())
    .filter(entry => typeof entry.bcv === 'number' && typeof entry.paralelo === 'number')
    .map(entry => ({
      fecha: entry.fecha,
      bcv: Number(entry.bcv),
      paralelo: Number(entry.paralelo),
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function fillMissingDays(data: ExchangeRate[], from: string, to: string) {
  if (!data.length) return data;

  const start = new Date(from);
  const end = new Date(to);
  const sorted = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const earliest = sorted[0];
  const earliestDate = new Date(earliest.fecha);

  const map = new Map(sorted.map(item => [item.fecha, item] as const));
  const filled: ExchangeRate[] = [];
  let lastKnown: ExchangeRate | null = null;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = formatDate(d);
    const existing = map.get(key);
    if (existing) {
      filled.push(existing);
      lastKnown = existing;
    } else if (lastKnown) {
      filled.push({ fecha: key, bcv: lastKnown.bcv, paralelo: lastKnown.paralelo });
    } else if (d <= earliestDate) {
      filled.push({ fecha: key, bcv: earliest.bcv, paralelo: earliest.paralelo });
    }
  }

  return filled.length ? filled : data;
}

export async function fetchExchangeRates(range: DateRange): Promise<ExchangeRate[]> {
  const { from, to } = getRangeDates(range);
  const params = new URLSearchParams({ from, to });

  const res = await fetch(`/api/rates?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Error consultando tasas (${res.status})`);
  }

  const payload: RatesApiResponse = await res.json();
  if (!payload.success) {
    throw new Error(payload.error || 'Error en la respuesta del servidor');
  }

  let merged: ExchangeRate[];

  if (Array.isArray(payload.data)) {
    const bcv = payload.data.filter(r => r.fuenteId === 'bcv_oficial');
    const usdt = payload.data.filter(r => r.fuenteId === 'binance_usdt');
    merged = mergeRates({ bcv, usdt });
  } else {
    merged = mergeRates({
    bcv: payload.data.bcv || [],
    usdt: payload.data.usdt || [],
    });
  }

  return fillMissingDays(merged, from, to);
}

export async function fetchLatestRate(range: DateRange = '7d'): Promise<ExchangeRate> {
  const data = await fetchExchangeRates(range);
  return data[data.length - 1];
}
