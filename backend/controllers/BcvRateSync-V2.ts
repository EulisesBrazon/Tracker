import { syncBcvRateV2 } from '../services';

export const BcvRateSyncV2Controller = {
  async get() {
    // Ejecuta la lógica de sincronización y retorna el resultado
    const result = await syncBcvRateV2();
    return result;
  },
};
