import axios from 'axios';
import { scrapeBcvRateV2 } from '../helpers/bcvScraperHelper-V2';
import { RateModel } from '../models';
import { RateDoc, RateHistory } from '../types';

const API_URL = process.env.DOLAR_API_URL || '';

async function upsertRate(
	fuenteId: string,
	nombre: string,
	moneda: string,
	precio: number,
	fechaPublicada: string,
	fechaDia: string
) {
	let rate = await RateModel.findOne({ fuenteId, fechaDia });

	const nuevoHist: RateHistory = {
		precio,
		timestamp: fechaPublicada,
		etiqueta: undefined,
	};

	if (rate) {
		const valorActualExistente = rate.valorActual;
		if (valorActualExistente !== precio) {
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
		return { actualizado: false, creado: false, rate };
	} else {
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

export async function syncBcvRate() {
	// 1. Consultar el valor y fecha del dólar y euro desde el BCV (webscraping)
	const scraped = await scrapeBcvRateV2();

	// Usar la fecha publicada por el BCV como timestamp de la actualización
	const fechaPublicada = scraped.fecha ?? new Date().toISOString();
	const fechaDia = new Date(fechaPublicada).toISOString().slice(0, 10);

	// 2. Guardar tasa oficial Dólar (USD)
	const precioDolar = typeof (scraped as any).valorDolar === 'number' ? (scraped as any).valorDolar : Number(scraped.valor);
	const resDolar = await upsertRate(
		'bcv_oficial',
		'Banco Central de Venezuela (USD)',
		'VES',
		precioDolar,
		fechaPublicada,
		fechaDia
	);

	// 3. Guardar tasa oficial Euro (EUR) si está disponible
	let resEuro: any = null;
	const precioEuro = (scraped as any).valorEuro;
	if (typeof precioEuro === 'number' && precioEuro > 0) {
		resEuro = await upsertRate(
			'bcv_euro_oficial',
			'Banco Central de Venezuela (EUR)',
			'VES',
			precioEuro,
			fechaPublicada,
			fechaDia
		);
	}

	return {
		actualizado: resDolar.actualizado || (resEuro?.actualizado ?? false),
		creado: resDolar.creado || (resEuro?.creado ?? false),
		dolar: resDolar.rate,
		euro: resEuro?.rate ?? null,
		rate: resDolar.rate, // compatibilidad hacia atrás
	};
}
