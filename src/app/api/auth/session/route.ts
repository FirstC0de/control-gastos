import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../lib/firebaseAdmin';

const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // 5 días en ms

// POST /api/auth/session → crear sesión
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION,
    });

    const response = NextResponse.json({ status: 'ok' });
    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   SESSION_DURATION / 1000, // en segundos
      path:     '/',
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}

// DELETE /api/auth/session → cerrar sesión
export async function DELETE() {
  const response = NextResponse.json({ status: 'ok' });
  response.cookies.set('session', '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  });
  return response;
}