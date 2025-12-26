import PemModel from '../models/pem';

export async function savePem(name: string, pem: string) {
  const now = new Date();
  const res = await PemModel.updateOne(
    { name },
    { $set: { pem, updatedAt: now } },
    { upsert: true }
  ).exec();
  return res;
}
