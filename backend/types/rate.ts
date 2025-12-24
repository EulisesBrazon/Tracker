export interface RateHistory {
	precio: number;
	timestamp: string;
	etiqueta?: string;
}

export interface RateDoc {
	fuenteId: string;
	nombre: string;
	moneda: string;
	fechaDia: string;
	ultimaActualizacion: string;
	valorActual: number;
	promedio: number;
	historial: RateHistory[];
}
