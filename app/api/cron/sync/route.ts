
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BcvRateSyncV2Controller } from '@/backend/controllers/BcvRateSync-V2';
import { UsdtRateSyncController } from '@/backend/controllers/UsdtRateSync';
import { safeCompare } from '@/lib/api-token';

async function handleSync(req: NextRequest) {
  // Validar token de autenticación en el header
  const token = req.headers.get('x-cron-token');
  const validToken = process.env.CRON_TOKEN;
  if (!token || !validToken || !safeCompare(token, validToken)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const bcv = await BcvRateSyncV2Controller.get();
    const usdt = await UsdtRateSyncController.get();
    return NextResponse.json({ success: true, bcv, usdt });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}
