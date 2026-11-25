import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BcvRateSyncV2Controller } from '@/backend/controllers/BcvRateSync-V2';
import { UsdtRateSyncController } from '@/backend/controllers/UsdtRateSync';
import { safeCompare } from '@/lib/api-token';

export const dynamic = 'force-dynamic';

async function handleSync(req: NextRequest) {
  // Validar token de autenticación en el header
  const token = req.headers.get('x-cron-token');
  const validToken = process.env.CRON_TOKEN;
  if (!token || !validToken || !safeCompare(token, validToken)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    await connectToDatabase();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error conectando a la base de datos';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }

  // Ejecutar BCV y USDT de forma independiente para que un fallo en una fuente no bloquee la otra
  const [bcvResult, usdtResult] = await Promise.allSettled([
    BcvRateSyncV2Controller.get(),
    UsdtRateSyncController.get(),
  ]);

  const bcvOk = bcvResult.status === 'fulfilled';
  const usdtOk = usdtResult.status === 'fulfilled';

  if (bcvOk && usdtOk) {
    return NextResponse.json({
      success: true,
      bcv: bcvResult.value,
      usdt: usdtResult.value,
    });
  }

  const errors: Record<string, string> = {};
  if (!bcvOk) {
    errors.bcv = bcvResult.reason instanceof Error ? bcvResult.reason.message : String(bcvResult.reason);
    console.error('[Cron API] Error sincronizando BCV:', bcvResult.reason);
  }
  if (!usdtOk) {
    errors.usdt = usdtResult.reason instanceof Error ? usdtResult.reason.message : String(usdtResult.reason);
    console.error('[Cron API] Error sincronizando USDT:', usdtResult.reason);
  }

  return NextResponse.json(
    {
      success: false,
      partial: bcvOk || usdtOk,
      bcv: bcvOk ? bcvResult.value : null,
      usdt: usdtOk ? usdtResult.value : null,
      errors,
      error: Object.entries(errors)
        .map(([source, msg]) => `${source}: ${msg}`)
        .join('; '),
    },
    { status: 500 }
  );
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}
