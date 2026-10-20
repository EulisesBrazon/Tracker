import {
  getLatestRates,
  getRatesForDate,
  getRatesSeries,
  isValidDateString,
} from '../services/getPublicRates';

/**
 * Los métodos `parse*` son puros y lanzan ante entrada inválida. Se llaman
 * ANTES de abrir la conexión a Mongo para que un request malformado no gaste
 * una conexión del cluster, que en el tier gratuito son un recurso escaso.
 */
export const publicRatesController = {
  parseDay(params: { date?: string | null }): string {
    const date = params.date?.trim();
    if (!date) {
      throw new Error('El parámetro "date" es requerido en formato yyyy-mm-dd');
    }
    if (!isValidDateString(date)) {
      throw new Error('Formato de fecha inválido. Se espera yyyy-mm-dd');
    }
    return date;
  },

  parseRange(params: { from?: string | null; to?: string | null }): {
    from: string;
    to: string;
  } {
    const from = params.from?.trim();
    const to = params.to?.trim();

    if (!from || !to) {
      throw new Error('Los parámetros "from" y "to" son requeridos en formato yyyy-mm-dd');
    }
    if (!isValidDateString(from) || !isValidDateString(to)) {
      throw new Error('Formato de fecha inválido. Se espera yyyy-mm-dd');
    }
    if (from > to) {
      throw new Error('El parámetro "from" debe ser menor o igual a "to"');
    }

    return { from, to };
  },

  /** Última tasa disponible de cada fuente. */
  async latest() {
    return getLatestRates();
  },

  /** Tasa vigente para un día concreto, con fallback al último dato anterior. */
  async day(date: string) {
    return getRatesForDate(date);
  },

  /** Serie unificada de tasas entre dos fechas. */
  async range(from: string, to: string) {
    return getRatesSeries(from, to);
  },
};
