/**
 * Tipos de la API pública de tasas.
 *
 * Deliberadamente desacoplados de los nombres internos: hacia afuera se habla
 * de `bcv` y `paralelo`, no de `bcv_oficial` ni `binance_usdt`. Así se puede
 * renombrar una fuente interna sin romper a los consumidores.
 */

export type PublicSource = 'bcv' | 'bcvEuro' | 'paralelo';

/** Nombres internos usados en la colección `rates`. */
export const SOURCE_IDS = {
  bcv: 'bcv_oficial',
  bcvEuro: 'bcv_euro_oficial',
  paralelo: 'binance_usdt',
} as const;

export interface PublicRateValue {
  /** Valor de la tasa en Bs por USD o EUR. */
  valor: number;
  /** Fecha REAL del dato devuelto, que puede no ser la solicitada. */
  fechaDia: string;
  /** true si no había dato para la fecha pedida y se devolvió uno anterior. */
  esFallback: boolean;
  /** Días entre la fecha solicitada y la fecha del dato devuelto. */
  diasDeAntiguedad: number;
  /** Timestamp de la última actualización registrada por el scraper. */
  actualizadoEn: string;
}

export interface PublicRateSnapshot {
  /** Fecha que pidió el consumidor, en formato yyyy-mm-dd. */
  fechaSolicitada: string;
  bcv: PublicRateValue | null;
  bcvEuro?: PublicRateValue | null;
  paralelo: PublicRateValue | null;
  /** ((paralelo - bcv) / bcv) * 100. null si falta alguna de las dos. */
  brechaPorcentual: number | null;
}

export interface PublicRateSeriesPoint {
  fechaDia: string;
  bcv: number | null;
  paralelo: number | null;
  brechaPorcentual: number | null;
}

export interface PublicRateSeries {
  from: string;
  to: string;
  puntos: PublicRateSeriesPoint[];
}
