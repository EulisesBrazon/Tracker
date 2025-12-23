"use client";

import { useDateRange } from '../context/DateRangeContext';
import { useExchangeData } from '../hooks/useExchangeData';
import { HomeContainer } from '../../Home/containers';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { PriceCard } from '../components/PriceCard';
import { BrechaCard } from '../components/BrechaCard';
import { StatsCard } from '../components/StatsCard';
import { PriceChart } from '../components/PriceChart';
import { BrechaChart } from '../components/BrechaChart';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export function ExchangeMonitorContainer() {
  const { dateRange } = useDateRange();
  const { chartData, stats, isLoading, error } = useExchangeData(dateRange);

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
        {/* Filter */}
        <div className="flex justify-center">
          <DateRangeFilter />
        </div>

        {isLoading || !stats ? (
          <LoadingSkeleton />
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
                current={stats.brecha.current}
                average={stats.brecha.average}
              />
              <StatsCard
                bcvStats={stats.periodStats.bcv}
                paraleloStats={stats.periodStats.paralelo}
              />
            </div>

            {/* Charts */}
            <div className="space-y-4">
              <PriceChart data={chartData} />
              <BrechaChart data={chartData} />
            </div>
          </>
        )}
      </div>
    </HomeContainer>
  );
}
