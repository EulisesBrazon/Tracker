// Entidad para la respuesta del endpoint https://ve.dolarapi.com/v1/dolares/oficial
export interface BcvRateApiResponse {
	fuente: string;
	nombre: string;
	compra: number | null;
	venta: number | null;
	promedio: number;
	fechaActualizacion: string;
}
