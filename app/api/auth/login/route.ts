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
      // set httpOnly cookie with token if provided
      const responseBody = { token: result.token, user: result.user };
      const res = NextResponse.json(responseBody);
      if (result.token) {
        // maxAge in seconds for 30 days
        res.cookies.set('token', result.token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30 });
      }
      return res;
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
