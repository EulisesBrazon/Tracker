import { RateModel } from '../models';
import { RateDoc } from '../types';

export type QueryRatesOptions = {
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  sources?: Array<'bcv_oficial' | 'binance_usdt'>; // if omitted, returns both
};

export async function queryRates(opts: QueryRatesOptions) {
  const { from, to, sources } = opts;

  // Basic validation
  if (!from || !to) throw new Error('Parámetros "from" y "to" son requeridos en formato yyyy-mm-dd');
  if (from > to) throw new Error('El parámetro "from" debe ser menor o igual a "to"');

  const filter: any = {
    fechaDia: { $gte: from, $lte: to },
  };

  if (sources && sources.length > 0) {
    filter.fuenteId = { $in: sources };
  }

  const docs = await RateModel.find(filter).sort({ fechaDia: 1 }).lean();

  // Map to a clean response shape (omit historial)
  const mapped = docs.map((d: any) => ({
    fuenteId: d.fuenteId,
    nombre: d.nombre,
    moneda: d.moneda,
    fechaDia: d.fechaDia,
    ultimaActualizacion: d.ultimaActualizacion,
    valorActual: d.valorActual,
    promedio: d.promedio,
  }));

  // Group by fuenteId
  const grouped = {
    bcv: mapped.filter((r) => r.fuenteId === 'bcv_oficial'),
    usdt: mapped.filter((r) => r.fuenteId === 'binance_usdt'),
  };

  return grouped;
}
