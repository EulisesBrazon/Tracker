import { syncBcvRate } from '../services/BcvRateSync';

export const BcvRateSyncController = {
	async get() {
		// Ejecuta la lógica de sincronización y retorna el resultado
		const result = await syncBcvRate();
		return result;
	},
};
