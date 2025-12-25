
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BcvRateSyncController } from '@/backend/controllers/BcvRateSync';
import { UsdtRateSyncController } from '@/backend/controllers/UsdtRateSync';

export async function GET(req: NextRequest) {
  // Validar token de autenticación en el header
  const token = req.headers.get('x-cron-token');
  const validToken = process.env.CRON_TOKEN;
  if (!token || !validToken || token !== validToken) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const bcv = await BcvRateSyncController.get();
    const usdt = await UsdtRateSyncController.get();
    return NextResponse.json({ bcv, usdt });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
