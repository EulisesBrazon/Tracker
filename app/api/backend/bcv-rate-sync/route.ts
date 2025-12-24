import { NextRequest, NextResponse } from 'next/server';
import { BcvRateSyncController } from '@/backend/controllers/BcvRateSync';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  await connectToDatabase();
  try {
    const result = await BcvRateSyncController.get();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
