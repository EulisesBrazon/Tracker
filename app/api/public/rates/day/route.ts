import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { publicRatesController } from '@/backend/controllers/publicRates';
import { guardPublicRequest, publicApiError } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/rates/day?date=yyyy-mm-dd
 *
 * Tasa vigente para un día concreto. Si no hay dato para esa fecha (fin de
 * semana, feriado o fallo del scraper), devuelve la última tasa anterior
 * disponible marcada con `esFallback: true`.
 */
export async function GET(req: NextRequest) {
  const guard = guardPublicRequest(req);
  if (!guard.ok) return guard.response;

  try {
    const date = publicRatesController.parseDay({
      date: req.nextUrl.searchParams.get('date'),
    });

    await connectToDatabase();
    const data = await publicRatesController.day(date);
    return NextResponse.json({ success: true, data }, { headers: guard.headers });
  } catch (err) {
    return publicApiError(err, guard.headers);
  }
}
