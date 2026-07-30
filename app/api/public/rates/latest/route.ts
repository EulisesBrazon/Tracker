import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { publicRatesController } from '@/backend/controllers/publicRates';
import { guardPublicRequest, publicApiError } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

/** GET /api/public/rates/latest — última tasa disponible de cada fuente. */
export async function GET(req: NextRequest) {
  const guard = guardPublicRequest(req);
  if (!guard.ok) return guard.response;

  try {
    await connectToDatabase();
    const data = await publicRatesController.latest();
    return NextResponse.json({ success: true, data }, { headers: guard.headers });
  } catch (err) {
    return publicApiError(err, guard.headers);
  }
}
