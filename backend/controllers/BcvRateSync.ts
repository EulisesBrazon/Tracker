import { syncBcvRate } from '../services';

export const BcvRateSyncController = {
	async get() {
		// Ejecuta la lógica de sincronización y retorna el resultado
		const result = await syncBcvRate();
		return result;
	},
};
