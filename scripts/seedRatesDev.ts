import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { RateModel } from '../backend/models';
dotenv.config();

/**
 * Siembra tasas de ejemplo para desarrollo local.
 *
 * Uso:  npm run seed:rates-dev
 *
 * El set incluye a propósito huecos que reproducen la realidad del BCV:
 * el sábado no publica y el domingo no hay ningún dato. Sirve para
 * comprobar que el fallback de `/api/public/rates/day` devuelve la última
 * tasa anterior en vez de dejar al consumidor sin tasa.
 *
 * SOLO para bases locales. Aborta si DATABASE_URL no apunta a localhost.
 */

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/test';

type Seed = { fechaDia: string; bcv?: number; paralelo?: number };

const SEEDS: Seed[] = [
  { fechaDia: '2026-07-24', bcv: 41.2, paralelo: 51.8 }, // viernes
  { fechaDia: '2026-07-25', paralelo: 52.0 },            // sábado: el BCV no publica
  { fechaDia: '2026-07-26' },                            // domingo: sin datos
  { fechaDia: '2026-07-27', bcv: 41.55, paralelo: 52.1 },
  { fechaDia: '2026-07-28', bcv: 41.7, paralelo: 52.4 },
  { fechaDia: '2026-07-29', bcv: 41.85, paralelo: 52.3 },
];

const FUENTES = {
  bcv: { fuenteId: 'bcv_oficial', nombre: 'BCV Oficial', moneda: 'USD' },
  paralelo: { fuenteId: 'binance_usdt', nombre: 'Binance USDT', moneda: 'USD' },
};

async function seed() {
  if (!/localhost|127\.0\.0\.1/.test(MONGODB_URI)) {
    throw new Error(
      'Este script solo corre contra una base local. DATABASE_URL no apunta a localhost.'
    );
  }

  await mongoose.connect(MONGODB_URI);

  let insertados = 0;

  for (const punto of SEEDS) {
    for (const clave of ['bcv', 'paralelo'] as const) {
      const valor = punto[clave];
      if (valor === undefined) continue;

      const fuente = FUENTES[clave];
      await RateModel.updateOne(
        { fuenteId: fuente.fuenteId, fechaDia: punto.fechaDia },
        {
          $set: {
            ...fuente,
            fechaDia: punto.fechaDia,
            ultimaActualizacion: `${punto.fechaDia}T07:00:00.000Z`,
            valorActual: valor,
            promedio: valor,
            historial: [
              { precio: valor, timestamp: `${punto.fechaDia}T07:00:00.000Z`, etiqueta: 'seed' },
            ],
          },
        },
        { upsert: true }
      );
      insertados += 1;
    }
  }

  const total = await RateModel.countDocuments();
  console.log(`Sembrados/actualizados ${insertados} registros. Total en la colección: ${total}`);
  console.log('Huecos intencionales: 2026-07-25 sin BCV, 2026-07-26 sin ninguna tasa.');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Error al sembrar tasas:', err instanceof Error ? err.message : err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
