import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BcvRateSyncController } from '@/backend/controllers/BcvRateSync';
import { UsdtRateSyncController } from '@/backend/controllers/UsdtRateSync';

export async function GET() {
  try {
    await connectToDatabase();
    const bcv = await BcvRateSyncController.get();
    const usdt = await UsdtRateSyncController.get();
    return NextResponse.json({ bcv, usdt });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
