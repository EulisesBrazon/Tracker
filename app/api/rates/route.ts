import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getRatesRangesController } from '@/backend/controllers/getRatesRanges';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;
  const source = url.searchParams.getAll('source');

  try {
    await connectToDatabase();
    const result = await getRatesRangesController.get({ from, to, source: source.length ? source : undefined });
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : 'Error interno';
    const status = message.includes('requeridos') || message.includes('Formato') ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
