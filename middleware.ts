import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from './src/app/lib/firebaseAdmin';

const PUBLIC_ROUTES = ['/login', '/registro', '/olvide-contrasena', '/terminos'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r));
  const session  = request.cookies.get('session')?.value;

  // Sin cookie → solo puede acceder a rutas públicas
  if (!session) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Con cookie → verificar que sea válida
  try {
    await adminAuth.verifySessionCookie(session, true); // true = verificar revocación
    if (isPublic) {
      // Ya logueado, no tiene sentido ir al login/registro
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  } catch {
    // Cookie inválida o expirada → limpiarla y redirigir
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('session', '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};