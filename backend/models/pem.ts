import mongoose, { Schema, model, Document } from 'mongoose';

interface Pem {
  name: string;
  pem: string;
  updatedAt: Date;
}

interface PemDocMongoose extends Pem, Document {}

const PemSchema = new Schema<PemDocMongoose>({
  name: { type: String, required: true, unique: true },
  pem: { type: String, required: true },
  updatedAt: { type: Date, required: true, default: () => new Date() },
});

const PemModel = (mongoose.models && (mongoose.models as any).Pem) || model<PemDocMongoose>('Pem', PemSchema);

export default PemModel;
export type { Pem };
