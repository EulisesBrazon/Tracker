"use client";

import React from 'react';

interface Props {
  base: 'bcv' | 'usdt';
  metric: 'brecha' | 'ratio';
  onChangeBase: (v: 'bcv' | 'usdt') => void;
  onChangeMetric: (v: 'brecha' | 'ratio') => void;
}

export function BrechaModeSelector({ base, metric, onChangeBase, onChangeMetric }: Props) {
  return (
    <div className="flex justify-center gap-4">
      <div className="flex rounded-lg border border-border bg-muted/50 p-1">
        <div
          className="flex items-center px-2"
          title="Selecciona la moneda base (USDT = paralelo, BCV = tasa oficial)"
        >
          <div className="flex" role="tablist" aria-label="Base">
            <button
              type="button"
              onClick={() => onChangeBase('usdt')}
              aria-pressed={base === 'usdt'}
              aria-label="USDT"
              className={
                base === 'usdt'
                  ? 'px-3 py-1.5 text-sm font-medium rounded-md bg-background text-foreground shadow-sm'
                  : 'px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground'
              }
            >
              USDT
            </button>
            <button
              type="button"
              onClick={() => onChangeBase('bcv')}
              aria-pressed={base === 'bcv'}
              aria-label="BCV"
              className={
                base === 'bcv'
                  ? 'ml-2 px-3 py-1.5 text-sm font-medium rounded-md bg-background text-foreground shadow-sm'
                  : 'ml-2 px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground'
              }
            >
              BCV
            </button>
          </div>
        </div>
      </div>

      <div className="flex rounded-lg border border-border bg-muted/50 p-1">
        <div className="flex items-center px-2" title="Selecciona cómo mostrar: Brecha (%) o Ratio (x)">
          <div className="flex" role="tablist" aria-label="Tipo">
            <button
              type="button"
              onClick={() => onChangeMetric('brecha')}
              aria-pressed={metric === 'brecha'}
              aria-label="Brecha"
              className={
                metric === 'brecha'
                  ? 'px-3 py-1.5 text-sm font-medium rounded-md bg-background text-foreground shadow-sm'
                  : 'px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground'
              }
            >
              Brecha
            </button>
            <button
              type="button"
              onClick={() => onChangeMetric('ratio')}
              aria-pressed={metric === 'ratio'}
              aria-label="Ratio"
              className={
                metric === 'ratio'
                  ? 'ml-2 px-3 py-1.5 text-sm font-medium rounded-md bg-background text-foreground shadow-sm'
                  : 'ml-2 px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground'
              }
            >
              Ratio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrechaModeSelector;
