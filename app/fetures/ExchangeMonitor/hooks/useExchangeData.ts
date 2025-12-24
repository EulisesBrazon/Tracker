import { useState, useEffect, useMemo } from 'react';
import { ExchangeRate, ExchangeDataPoint, ExchangeStats, DateRange } from '../types';
import { fetchExchangeRates } from '../services/exchangeService';

function calculateBrecha(bcv: number, paralelo: number): number {
  if (!paralelo || paralelo === 0) return 0;
  const ratio = bcv / paralelo;
  const brecha = 1 - ratio;
  return Number((brecha * 100).toFixed(2));
}

function filterByDateRange(data: ExchangeRate[], range: DateRange): ExchangeRate[] {
  const today = new Date();
  let startDate: Date;

  switch (range) {
    case 'today':
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '7d':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case '30d':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      break;
    case 'ytd':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
  }

  return data.filter(item => new Date(item.fecha) >= startDate);
}

export function useExchangeData(dateRange: DateRange) {
  const [rawData, setRawData] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const data = await fetchExchangeRates(dateRange);
        if (!active) return;
        setRawData(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError('Error al cargar los datos');
      } finally {
        if (!active) return;
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [dateRange]);

  const filteredData = useMemo(() => {
    return filterByDateRange(rawData, dateRange);
  }, [rawData, dateRange]);

  const chartData: ExchangeDataPoint[] = useMemo(() => {
    return filteredData.map(item => ({
      ...item,
      // brecha según fórmula (1 - bcv/paralelo) * 100 (brecha respecto al paralelo)
      brecha: calculateBrecha(item.bcv, item.paralelo),
      // brecha respecto a la tasa oficial (BCV) -> (paralelo - bcv) / bcv * 100
      brecha_official: item.bcv === 0 ? 0 : Number((((item.paralelo - item.bcv) / item.bcv) * 100).toFixed(2)),
      // ratio directo paralelo / bcv
      ratio: item.bcv === 0 ? 0 : Number((item.paralelo / item.bcv).toFixed(2)),
      // ratio inverso bcv / paralelo
      ratio_inv: item.paralelo === 0 ? 0 : Number((item.bcv / item.paralelo).toFixed(2)),
    }));
  }, [filteredData]);

  const stats: ExchangeStats | null = useMemo(() => {
    if (filteredData.length < 2) return null;

    const current = filteredData[filteredData.length - 1];
    const previous = filteredData[filteredData.length - 2];

    const bcvValues = filteredData.map(d => d.bcv);
    const paraleloValues = filteredData.map(d => d.paralelo);
    const brechaValues = filteredData.map(d => calculateBrecha(d.bcv, d.paralelo));

    const bcvVariation = Number((((current.bcv - previous.bcv) / previous.bcv) * 100).toFixed(2));
    const paraleloVariation = Number((((current.paralelo - previous.paralelo) / previous.paralelo) * 100).toFixed(2));

    return {
      bcv: {
        current: current.bcv,
        previous: previous.bcv,
        variation: bcvVariation,
        trend: bcvVariation > 0.1 ? 'up' : bcvVariation < -0.1 ? 'down' : 'stable',
      },
      paralelo: {
        current: current.paralelo,
        previous: previous.paralelo,
        variation: paraleloVariation,
        trend: paraleloVariation > 0.1 ? 'up' : paraleloVariation < -0.1 ? 'down' : 'stable',
      },
      brecha: {
        current: calculateBrecha(current.bcv, current.paralelo),
        average: Number((brechaValues.reduce((a, b) => a + b, 0) / brechaValues.length).toFixed(2)),
      },
      periodStats: {
        bcv: {
          average: Number((bcvValues.reduce((a, b) => a + b, 0) / bcvValues.length).toFixed(2)),
          max: Math.max(...bcvValues),
          min: Math.min(...bcvValues),
        },
        paralelo: {
          average: Number((paraleloValues.reduce((a, b) => a + b, 0) / paraleloValues.length).toFixed(2)),
          max: Math.max(...paraleloValues),
          min: Math.min(...paraleloValues),
        },
      },
    };
  }, [filteredData]);

  return {
    chartData,
    stats,
    isLoading,
    error,
  };
}
