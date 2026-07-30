import { RateModel } from '../models';
import {
  PublicRateSeries,
  PublicRateSeriesPoint,
  PublicRateSnapshot,
  PublicRateValue,
  SOURCE_IDS,
} from '../types/publicRate';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** Días completos entre dos fechas yyyy-mm-dd. */
function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round(Math.abs(b - a) / 86_400_000);
}

export function calcularBrecha(bcv: number | null, paralelo: number | null): number | null {
  if (bcv === null || paralelo === null || bcv <= 0) return null;
  return Number((((paralelo - bcv) / bcv) * 100).toFixed(2));
}

/**
 * Busca la tasa de una fuente para una fecha, con fallback a la última
 * disponible anterior.
 *
 * El fallback no es un lujo: el BCV no publica los fines de semana ni los
 * feriados, y sin él un domingo dejaría al consumidor sin poder registrar
 * una venta.
 */
async function findRateForDate(
  fuenteId: string,
  fecha: string
): Promise<PublicRateValue | null> {
  const doc = (await RateModel.findOne({ fuenteId, fechaDia: { $lte: fecha } })
    .sort({ fechaDia: -1 })
    .lean()) as {
    fechaDia: string;
    valorActual: number;
    ultimaActualizacion: string;
  } | null;

  if (!doc) return null;

  return {
    valor: doc.valorActual,
    fechaDia: doc.fechaDia,
    esFallback: doc.fechaDia !== fecha,
    diasDeAntiguedad: daysBetween(doc.fechaDia, fecha),
    actualizadoEn: doc.ultimaActualizacion,
  };
}

/** Tasas vigentes para una fecha concreta. */
export async function getRatesForDate(fecha: string): Promise<PublicRateSnapshot> {
  if (!isValidDateString(fecha)) {
    throw new Error('Formato de fecha inválido. Se espera yyyy-mm-dd');
  }

  const [bcv, paralelo] = await Promise.all([
    findRateForDate(SOURCE_IDS.bcv, fecha),
    findRateForDate(SOURCE_IDS.paralelo, fecha),
  ]);

  return {
    fechaSolicitada: fecha,
    bcv,
    paralelo,
    brechaPorcentual: calcularBrecha(bcv?.valor ?? null, paralelo?.valor ?? null),
  };
}

/**
 * Última tasa disponible de cada fuente.
 *
 * Se resuelve contra la fecha más reciente presente en la colección, no
 * contra "hoy" del servidor: así el endpoint sigue respondiendo con datos
 * útiles aunque el scraper lleve un par de días caído.
 */
export async function getLatestRates(): Promise<PublicRateSnapshot> {
  const masReciente = (await RateModel.findOne({
    fuenteId: { $in: [SOURCE_IDS.bcv, SOURCE_IDS.paralelo] },
  })
    .sort({ fechaDia: -1 })
    .lean()) as { fechaDia: string } | null;

  if (!masReciente) {
    return {
      fechaSolicitada: new Date().toISOString().slice(0, 10),
      bcv: null,
      paralelo: null,
      brechaPorcentual: null,
    };
  }

  return getRatesForDate(masReciente.fechaDia);
}

/**
 * Serie de tasas entre dos fechas, unificada por día.
 *
 * A diferencia de `/api/rates`, que devuelve dos arrays separados, aquí cada
 * punto trae ambas fuentes y la brecha ya calculada. Es lo que necesita una
 * gráfica y evita que cada consumidor repita el cruce por fecha.
 */
export async function getRatesSeries(from: string, to: string): Promise<PublicRateSeries> {
  if (!isValidDateString(from) || !isValidDateString(to)) {
    throw new Error('Formato de fecha inválido. Se espera yyyy-mm-dd');
  }
  if (from > to) {
    throw new Error('El parámetro "from" debe ser menor o igual a "to"');
  }

  const docs = (await RateModel.find({
    fuenteId: { $in: [SOURCE_IDS.bcv, SOURCE_IDS.paralelo] },
    fechaDia: { $gte: from, $lte: to },
  })
    .sort({ fechaDia: 1 })
    .lean()) as Array<{ fuenteId: string; fechaDia: string; valorActual: number }>;

  const porFecha = new Map<string, PublicRateSeriesPoint>();

  for (const doc of docs) {
    const punto =
      porFecha.get(doc.fechaDia) ??
      { fechaDia: doc.fechaDia, bcv: null, paralelo: null, brechaPorcentual: null };

    if (doc.fuenteId === SOURCE_IDS.bcv) punto.bcv = doc.valorActual;
    if (doc.fuenteId === SOURCE_IDS.paralelo) punto.paralelo = doc.valorActual;

    porFecha.set(doc.fechaDia, punto);
  }

  const puntos = Array.from(porFecha.values())
    .sort((a, b) => a.fechaDia.localeCompare(b.fechaDia))
    .map((p) => ({ ...p, brechaPorcentual: calcularBrecha(p.bcv, p.paralelo) }));

  return { from, to, puntos };
}
