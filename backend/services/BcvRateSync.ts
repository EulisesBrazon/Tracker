import axios from 'axios';
import { RateModel } from '../models';
import { RateDoc, RateHistory } from '../types';

const API_URL = process.env.DOLAR_API_URL || '';

export async function syncBcvRate() {
	console.log('[Service] syncBcvRate llamada');
	// 1. Consultar el endpoint externo
	const { data } = await axios.get(API_URL);
	console.log('[Service] Respuesta de dolarapi:', data);
	const {
		fuente,
		nombre,
		promedio,
		fechaActualizacion
	} = data;

	// 2. Preparar datos
	const today = new Date(fechaActualizacion).toISOString().slice(0, 10); // yyyy-mm-dd
	const fuenteId = 'bcv_oficial';
	const moneda = 'VES';

	// 3. Buscar si ya existe un rate para hoy
	let rate = await RateModel.findOne({ fuenteId, fechaDia: today });

	// 4. Preparar nuevo histórico
	const nuevoHist: RateHistory = {
		precio: promedio,
		timestamp: fechaActualizacion,
		etiqueta: undefined,
	};

	if (rate) {
		// Verificar si ya existe ese timestamp en el historial
		const existe = rate.historial.some((historialItem: RateHistory) => historialItem.timestamp === fechaActualizacion);
		if (!existe) {
			rate.historial.push(nuevoHist);
			rate.valorActual = promedio;
			rate.ultimaActualizacion = fechaActualizacion;
			rate.promedio = promedio;
			await rate.save();
			return { actualizado: true, creado: false, rate };
		} else {
			return { actualizado: false, creado: false, rate };
		}
	} else {
		// Crear nuevo registro
		const nuevoRate: RateDoc = {
			fuenteId,
			nombre,
			moneda,
			fechaDia: today,
			ultimaActualizacion: fechaActualizacion,
			valorActual: promedio,
			promedio,
			historial: [nuevoHist],
		};
		const creado = await RateModel.create(nuevoRate);
		return { actualizado: false, creado: true, rate: creado };
	}
}
