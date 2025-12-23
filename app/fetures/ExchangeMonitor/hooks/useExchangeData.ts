import { useState, useEffect, useMemo } from 'react';
import { ExchangeRate, ExchangeDataPoint, ExchangeStats, DateRange } from '../types';
import { fetchExchangeRates } from '../services/exchangeService';

function calculateBrecha(bcv: number, paralelo: number): number {
  return Number((((paralelo - bcv) / bcv) * 100).toFixed(2));
}

function filterByDateRange(data: ExchangeRate[], range: DateRange): ExchangeRate[] {
  const today = new Date();
  let startDate: Date;

  switch (range) {
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
  }

  return data.filter(item => new Date(item.fecha) >= startDate);
}

export function useExchangeData(dateRange: DateRange) {
  const [rawData, setRawData] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await fetchExchangeRates();
        setRawData(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return filterByDateRange(rawData, dateRange);
  }, [rawData, dateRange]);

  const chartData: ExchangeDataPoint[] = useMemo(() => {
    return filteredData.map(item => ({
      ...item,
      brecha: calculateBrecha(item.bcv, item.paralelo),
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
