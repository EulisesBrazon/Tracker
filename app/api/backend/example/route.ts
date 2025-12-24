import { NextResponse } from 'next/server';
import { ExampleController } from '../../../../backend/controllers/ExampleController';

export async function GET() {
  try {
    const data = await ExampleController.handleGet();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
