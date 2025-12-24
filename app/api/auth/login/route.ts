import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { loginController } from '@/backend/controllers';

export async function POST(req: NextRequest) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) return NextResponse.json({ message: 'Email y contraseña requeridos' }, { status: 400 });

    // Delegate authentication to the backend controller
    try {
      const result = await loginController.post({ username: String(email), password: String(password) });
      return NextResponse.json(result);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      const status = message === 'Usuario no encontrado' || message === 'Contraseña incorrecta' ? 401 : 400;
      return NextResponse.json({ message }, { status });
    }
  } catch (err: any) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ message }, { status: 500 });
  }
}
