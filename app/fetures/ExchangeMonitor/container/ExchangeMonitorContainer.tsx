"use client";

import { useDateRange } from '../context/DateRangeContext';
import { useExchangeData } from '../hooks/useExchangeData';
import { useState, useMemo } from 'react';
import { HomeContainer } from '../../Home/containers';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { BrechaModeSelector } from '../components/BrechaModeSelector';
import { PriceCard } from '../components/PriceCard';
import { BrechaCard } from '../components/BrechaCard';
import { StatsCard } from '../components/StatsCard';
import { PriceChart } from '../components/PriceChart';
import { BrechaChart } from '../components/BrechaChart';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export function ExchangeMonitorContainer() {
  const { dateRange } = useDateRange();
  const { chartData, stats, isLoading, error } = useExchangeData(dateRange);
  const [base, setBase] = useState<'bcv' | 'usdt'>('usdt');
  const [metric, setMetric] = useState<'brecha' | 'ratio'>('brecha');

  // derive legacy mode string used by child components
  const brechaMode = useMemo(() => {
    if (metric === 'brecha' && base === 'bcv') return 'official';
    if (metric === 'brecha' && base === 'usdt') return 'parallel';
    if (metric === 'ratio' && base === 'usdt') return 'ratio';
    if (metric === 'ratio' && base === 'bcv') return 'ratio_inv';
    return 'parallel';
  }, [base, metric]);

  const brechaValues = useMemo(() => {
    if (!chartData?.length) return { current: 0, average: 0 };
    if (brechaMode === 'official') {
      const vals = chartData.map(d => d.brecha_official ?? 0);
      return { current: vals[vals.length - 1], average: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) };
    }
    if (brechaMode === 'ratio') {
      const vals = chartData.map(d => d.ratio ?? 0);
      return { current: vals[vals.length - 1], average: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) };
    }
    if (brechaMode === 'ratio_inv') {
      const vals = chartData.map(d => d.ratio_inv ?? 0);
      return { current: vals[vals.length - 1], average: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) };
    }
    // default: paralelo-based brecha
    const vals = chartData.map(d => d.brecha ?? 0);
    return { current: vals[vals.length - 1], average: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) };
  }, [chartData, brechaMode]);

  if (error) {
    return (
      <HomeContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-destructive">{error}</p>
        </div>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <div className="container mx-auto max-w-7xl px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Filter + Selector: row on sm+, column on mobile */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="w-full sm:w-auto flex justify-center">
            <DateRangeFilter />
          </div>

          <div className="w-full sm:w-auto flex justify-center">
            <BrechaModeSelector base={base} metric={metric} onChangeBase={setBase} onChangeMetric={setMetric} />
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : !stats ? (
          <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-center text-sm sm:text-base">
            No hay suficientes datos para mostrar indicadores. Sincroniza al menos dos valores (BCV y USDT) en días distintos.
          </div>
        ) : (
          <>
            {/* Indicator Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <PriceCard
                title="Tasa BCV"
                indicator={stats.bcv}
                variant="bcv"
              />
              <PriceCard
                title="Tasa Paralelo"
                indicator={stats.paralelo}
                variant="paralelo"
              />
              <BrechaCard
                current={brechaValues.current}
                average={brechaValues.average}
                mode={brechaMode}
              />
              <StatsCard
                bcvStats={stats.periodStats.bcv}
                paraleloStats={stats.periodStats.paralelo}
              />
            </div>

            {/* Charts */}
            <div className="space-y-4">
              <PriceChart data={chartData} />
              <BrechaChart data={chartData} mode={brechaMode} />
            </div>
          </>
        )}
      </div>
    </HomeContainer>
  );
}
