import 'dotenv/config';
import { connectToDatabase } from '../lib/mongodb';
import { RateModel } from '../backend/models';

async function main() {
  console.log('[FixIndexes] Connecting to DB...');
  await connectToDatabase();

  const indexes = await RateModel.collection.indexes();
  const hasOld = indexes.find((i) => i.name === 'fuenteId_1');
  if (hasOld) {
    console.log('[FixIndexes] Dropping old unique index fuenteId_1');
    try {
      await RateModel.collection.dropIndex('fuenteId_1');
      console.log('[FixIndexes] Dropped fuenteId_1');
    } catch (e) {
      console.error('[FixIndexes] Error dropping fuenteId_1', e);
    }
  } else {
    console.log('[FixIndexes] Old index fuenteId_1 not found');
  }

  try {
    console.log('[FixIndexes] Ensuring compound unique index on {fuenteId:1, fechaDia:1}');
    await RateModel.collection.createIndex({ fuenteId: 1, fechaDia: 1 }, { unique: true });
    console.log('[FixIndexes] Compound index ensured');
  } catch (e) {
    console.error('[FixIndexes] Error creating compound index', e);
  }

  console.log('[FixIndexes] Done');
  process.exit(0);
}

main().catch((e) => {
  console.error('[FixIndexes] Fatal error', e);
  process.exit(1);
});
