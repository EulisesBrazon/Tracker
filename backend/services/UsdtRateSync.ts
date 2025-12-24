import axios from 'axios';
import { RateModel } from '../models';
import { RateDoc, RateHistory } from '../types';

const BINANCE_API = process.env.BINANCE_API_URL || '';

export async function syncUsdtRate() {
	// 1. Preparar payload para Binance
	const payload = {
		asset: 'USDT',
		fiat: 'VES',
		merchantCheck: true,
		page: 1,
		rows: 15,
		payTypes: ['Bank'],
		publisherType: null,
		tradeType: 'BUY',
	};

	// 2. Consultar Binance
	const { data } = await axios.post(BINANCE_API, payload, {
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
		},
	});

	if (data.code === '000000' && data.data?.length > 10) {
		// 3. Procesar precios
		const prices: number[] = data.data.map((item: any) => parseFloat(item.adv.price));
		const sample: number[] = prices.slice(3, 13);
		const sum: number = sample.reduce((acc, curr) => acc + curr, 0);
		const average: number = sum / sample.length;

		// 4. Preparar datos para guardar
		const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
		const fuenteId = 'binance_usdt';
		const nombre = 'Binance P2P USDT';
		const moneda = 'VES';
		const fechaActualizacion = new Date().toISOString();

		let rate = await RateModel.findOne({ fuenteId, fechaDia: today });
		const nuevoHist: RateHistory = {
			precio: average,
			timestamp: fechaActualizacion,
			etiqueta: undefined,
		};

		if (rate) {
			const existe = rate.historial.some((historialItem: RateHistory) => historialItem.timestamp === fechaActualizacion);
			if (!existe) {
				rate.historial.push(nuevoHist);
				rate.ultimaActualizacion = fechaActualizacion;
				rate.promedio = average;
				await rate.save();
				return { actualizado: true, creado: false, rate };
			} else {
				return { actualizado: false, creado: false, rate };
			}
		} else {
			const nuevoRate: RateDoc = {
				fuenteId,
				nombre,
				moneda,
				fechaDia: today,
				ultimaActualizacion: fechaActualizacion,
				valorActual: average,
				promedio: average,
				historial: [nuevoHist],
			};
			const creado = await RateModel.create(nuevoRate);
			return { actualizado: false, creado: true, rate: creado };
		}
	}

	throw new Error('No se pudo obtener una muestra suficiente de Binance');
}
