import axios from 'axios';
import { scrapeBcvRateV2 } from '../helpers/bcvScraperHelper-V2';
import { RateModel } from '../models';
import { RateDoc, RateHistory } from '../types';

const API_URL = process.env.DOLAR_API_URL || '';

export async function syncBcvRate() {
	// 1. Consultar el valor y fecha del dólar desde el BCV (webscraping)
	const scraped = await scrapeBcvRateV2();
	const fuente = 'BCV';
	const nombre = 'Banco Central de Venezuela';

	// Normalizar/convertir valor retornado por el helper
	const precio = typeof scraped.valor === 'number' ? scraped.valor : Number(scraped.valor);
	// usar la fecha publicada por el BCV como timestamp de la actualización
	const fechaPublicada = scraped.fecha ?? new Date().toISOString();

	// Derivar la fecha del día (yyyy-mm-dd) a partir de la fecha publicada
	// Esto asegura que el registro se asocie al día que indica la fuente, no a la fecha del request
	const fechaDia = new Date(fechaPublicada).toISOString().slice(0, 10);

	const fuenteId = 'bcv_oficial';
	const moneda = 'VES';

	// Buscar si ya existe un rate para la fecha publicada
	let rate = await RateModel.findOne({ fuenteId, fechaDia });

	// Preparar el histórico a insertar si aplica
	const nuevoHist: RateHistory = {
		precio,
		timestamp: fechaPublicada,
		etiqueta: undefined,
	};

	if (rate) {
		// Si el registro existe para esa fecha, comprobar si el valor actual difiere
		const valorActualExistente = rate.valorActual;
		if (valorActualExistente !== precio) {
			// Añadir un nuevo entry al historial y actualizar el valorActual/ultimaActualizacion
			// Evitar duplicados por timestamp exacto
			const existeTimestamp = rate.historial.some((h: RateHistory) => h.timestamp === fechaPublicada);
			if (!existeTimestamp) {
				rate.historial.push(nuevoHist);
			}
			rate.valorActual = precio;
			rate.ultimaActualizacion = fechaPublicada;
			rate.promedio = precio;
			await rate.save();
			return { actualizado: true, creado: false, rate };
		}
		// Si el valor no cambió, no hacemos nada
		return { actualizado: false, creado: false, rate };
	} else {
		// Crear nuevo registro para la fecha publicada
		const nuevoRate: RateDoc = {
			fuenteId,
			nombre,
			moneda,
			fechaDia,
			ultimaActualizacion: fechaPublicada,
			valorActual: precio,
			promedio: precio,
			historial: [nuevoHist],
		};
		const creado = await RateModel.create(nuevoRate);
		return { actualizado: false, creado: true, rate: creado };
	}
}
