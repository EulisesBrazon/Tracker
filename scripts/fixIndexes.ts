import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

/**
 * Repara los índices de la colección `rates`.
 *
 * Uso:  npm run db:fix-indexes -- --dry-run
 *       npm run db:fix-indexes
 *
 * Versiones antiguas del esquema dejaron un índice ÚNICO sobre `fuenteId`
 * solo. Ese índice permite un único documento por fuente en toda la
 * colección, lo que impide guardar el histórico diario: el segundo día de
 * scraping falla con E11000. El índice correcto es el compuesto
 * { fuenteId, fechaDia }, que garantiza un registro por fuente y por día.
 */

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/test';
const DRY_RUN = process.argv.includes('--dry-run');

const COMPUESTO = { fuenteId: 1, fechaDia: 1 } as const;

function esIndiceSoloFuenteId(key: Record<string, unknown>): boolean {
  const claves = Object.keys(key);
  return claves.length === 1 && claves[0] === 'fuenteId';
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No se pudo obtener la base de datos');

  const existe = await db.listCollections({ name: 'rates' }).hasNext();
  if (!existe) {
    console.log('La colección `rates` no existe todavía. Nada que reparar.');
    await mongoose.disconnect();
    return;
  }

  const coleccion = db.collection('rates');
  const indices = await coleccion.indexes();

  console.log(`Documentos en \`rates\`: ${await coleccion.countDocuments()}`);
  console.log('Índices actuales:');
  for (const i of indices) {
    console.log(`  - ${i.name} ${JSON.stringify(i.key)}${i.unique ? ' [UNIQUE]' : ''}`);
  }
  console.log('');

  const sobrantes = indices.filter(
    (i) => i.name !== '_id_' && esIndiceSoloFuenteId(i.key as Record<string, unknown>) && i.unique
  );

  const tieneCompuesto = indices.some(
    (i) => JSON.stringify(i.key) === JSON.stringify(COMPUESTO)
  );

  if (sobrantes.length === 0 && tieneCompuesto) {
    console.log('Los índices ya son correctos. Nada que hacer.');
    await mongoose.disconnect();
    return;
  }

  for (const i of sobrantes) {
    console.log(`${DRY_RUN ? '[dry-run] Se eliminaría' : 'Eliminando'} índice único incorrecto: ${i.name}`);
    if (!DRY_RUN) await coleccion.dropIndex(i.name!);
  }

  if (!tieneCompuesto) {
    console.log(`${DRY_RUN ? '[dry-run] Se crearía' : 'Creando'} índice único compuesto { fuenteId, fechaDia }`);
    if (!DRY_RUN) await coleccion.createIndex(COMPUESTO, { unique: true });
  }

  if (DRY_RUN) {
    console.log('\nEjecución en seco: no se modificó nada.');
  } else {
    console.log('\nÍndices resultantes:');
    for (const i of await coleccion.indexes()) {
      console.log(`  - ${i.name} ${JSON.stringify(i.key)}${i.unique ? ' [UNIQUE]' : ''}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Error al reparar índices:', err instanceof Error ? err.message : err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
