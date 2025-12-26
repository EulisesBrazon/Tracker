import mongoose, { Schema, model, Document } from 'mongoose';
import { RateDoc, RateHistory } from '../types';

interface RateDocMongoose extends RateDoc, Document {}

const RateHistorySchema = new Schema<RateHistory>({
	precio: { type: Number, required: true },
	timestamp: { type: String, required: true },
	etiqueta: { type: String },
}, { _id: false });

const RateSchema = new Schema<RateDocMongoose>({
	fuenteId: { type: String, required: true, index: true },
	nombre: { type: String, required: true },
	moneda: { type: String, required: true },
	fechaDia: { type: String, required: true },
	ultimaActualizacion: { type: String, required: true },
	valorActual: { type: Number, required: true },
	promedio: { type: Number, required: true },
	historial: { type: [RateHistorySchema], default: [] },
});

// Índice compuesto para garantizar un único registro por fuente y día
RateSchema.index({ fuenteId: 1, fechaDia: 1 }, { unique: true });

export const RateModel = (mongoose.models && (mongoose.models as any).Rate) || model<RateDocMongoose>('Rate', RateSchema);
