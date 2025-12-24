import axios from 'axios';
import { RateModel } from '../models/rate';
import { RateDoc, RateHistory } from '../types';

const API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';

export async function syncBcvRate() {
	// 1. Consultar el endpoint externo
	const { data } = await axios.get(API_URL);
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
		const existe = rate.historial.some(h => h.timestamp === fechaActualizacion);
		if (!existe) {
			rate.historial.push(nuevoHist);
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
