import { syncUsdtRate } from '../services';

export const UsdtRateSyncController = {
	async get() {
		// Ejecuta la lógica de sincronización y retorna el resultado
		const result = await syncUsdtRate();
		return result;
	},
};
