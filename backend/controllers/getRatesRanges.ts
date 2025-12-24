import { queryRates } from '../services/getRatesRanges';

export const getRatesRangesController = {
  async get(params: { from?: string; to?: string; source?: string | string[] }) {
    const { from, to, source } = params;

    if (!from || !to) {
      throw new Error('Parámetros "from" y "to" son requeridos en formato yyyy-mm-dd');
    }

    const sources: Array<'bcv_oficial' | 'binance_usdt'> | undefined = (() => {
      if (!source) return undefined;
      const srcs = Array.isArray(source) ? source : [source];
      const mapped = srcs
        .map(s => s.toString().toLowerCase())
        .filter(s => s === 'bcv' || s === 'bcv_oficial' || s === 'usdt' || s === 'binance_usdt')
        .map(s => (s === 'bcv' ? 'bcv_oficial' : s === 'usdt' ? 'binance_usdt' : s));
      return mapped.length > 0 ? (mapped as Array<'bcv_oficial' | 'binance_usdt'>) : undefined;
    })();

    const results = await queryRates({ from, to, sources });
    return results;
  },
};
