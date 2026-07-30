import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { publicRatesController } from '@/backend/controllers/publicRates';
import { guardPublicRequest, publicApiError } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/rates/range?from=yyyy-mm-dd&to=yyyy-mm-dd
 *
 * Serie unificada por día: cada punto trae ambas fuentes y la brecha ya
 * calculada. Pensado para el backfill histórico y para las gráficas del
 * panel administrativo.
 */
export async function GET(req: NextRequest) {
  const guard = guardPublicRequest(req);
  if (!guard.ok) return guard.response;

  try {
    const params = req.nextUrl.searchParams;
    const { from, to } = publicRatesController.parseRange({
      from: params.get('from'),
      to: params.get('to'),
    });

    await connectToDatabase();
    const data = await publicRatesController.range(from, to);
    return NextResponse.json({ success: true, data }, { headers: guard.headers });
  } catch (err) {
    return publicApiError(err, guard.headers);
  }
}
