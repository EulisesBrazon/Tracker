import 'dotenv/config';
import cron from 'node-cron';
import { connectToDatabase } from '../lib/mongodb';
import { syncBcvRate, syncUsdtRate } from '../backend/services';

async function runSync(label: string, fn: () => Promise<any>) {
  try {
    console.log(`[Cron] Iniciando tarea: ${label} @ ${new Date().toISOString()}`);
    await connectToDatabase();
    const res = await fn();
    console.log(`[Cron] Tarea ${label} OK`, { actualizado: res.actualizado, creado: res.creado });
  } catch (err) {
    console.error(`[Cron] Tarea ${label} FALLÓ`, err);
  }
}

function scheduleJobs() {
  // Ejecutar a las 09:00, 13:00 y 18:00 hora de Venezuela (America/Caracas)
  const expression = '0 9,13,18 * * *';
  const options = { timezone: 'America/Caracas' } as const;

  cron.schedule(expression, async () => {
    await runSync('BCV', syncBcvRate);
    await runSync('USDT', syncUsdtRate);
  }, options);

  console.log('[Cron] Programado: 09:00, 13:00, 18:00 America/Caracas');
}

async function main() {
  console.log('[Cron] Arrancando scheduler...');
  scheduleJobs();

  // Ejecución inmediata opcional al iniciar para probar/registrar
  if (process.env.CRON_RUN_ON_START === 'true') {
    await runSync('BCV', syncBcvRate);
    await runSync('USDT', syncUsdtRate);
  }
}

main().catch((e) => {
  console.error('[Cron] Error fatal al iniciar', e);
  process.exit(1);
});
