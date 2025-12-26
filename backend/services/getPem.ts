import PemModel, { Pem } from '../models/pem';

export type PemDoc = Pem & { _id?: any };

export async function fetchPem(name = 'bcv-cert'): Promise<PemDoc | null> {
  const doc = await PemModel.findOne({ name }).lean().exec();
  return (doc as PemDoc) || null;
}
