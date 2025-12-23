export interface ExchangeRate {
  fecha: string;
  bcv: number;
  paralelo: number;
}

export interface ExchangeDataPoint extends ExchangeRate {
  brecha: number;
}

export interface PriceIndicator {
  current: number;
  previous: number;
  variation: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PeriodStats {
  average: number;
  max: number;
  min: number;
}

export interface ExchangeStats {
  bcv: PriceIndicator;
  paralelo: PriceIndicator;
  brecha: {
    current: number;
    average: number;
  };
  periodStats: {
    bcv: PeriodStats;
    paralelo: PeriodStats;
  };
}

export type DateRange = '7d' | '30d' | 'ytd';
