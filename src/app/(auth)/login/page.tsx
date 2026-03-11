'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import AuthFormContainer from '@/app/components/Auth/AuthFormContainer';
import AuthSocialButtons from '@/app/components/Auth/AuthSocialButtons';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const inputClass = "block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow";

// Labels:
const labelClass = "ml-2 block text-sm font-medium text-slate-700 mb-1.5";

// Botón principal:
const btnClass = "flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      setError(getFirebaseError((err as { code: string }).code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormContainer
      title="Iniciar sesión"
      subtitle="Ingresa tus credenciales para acceder a tu cuenta"
      footerText="¿No tienes una cuenta?"
      footerLink="/registro"
      footerLinkText="Regístrate"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className= {labelClass}>
            Correo electrónico
          </label>
          <div className="mt-2">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className= {labelClass}>
            Contraseña
          </label>
          <div className="mt-2">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className={inputClass}
            />
            <label htmlFor="remember-me" className={labelClass}>
              Recuérdame
            </label>
          </div>
          <div className="text-sm">
            <Link href="/olvide-contrasena" className="font-medium text-indigo-600 hover:text-indigo-500">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={btnClass}
        >
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>

      <AuthSocialButtons />
    </AuthFormContainer>
  );
}

// Traduce códigos de error de Firebase a mensajes amigables
function getFirebaseError(code: string): string {
  const errors: Record<string, string> = {
    'auth/invalid-credential':       'Email o contraseña incorrectos.',
    'auth/user-not-found':           'No existe una cuenta con ese email.',
    'auth/wrong-password':           'Contraseña incorrecta.',
    'auth/too-many-requests':        'Demasiados intentos. Intentá más tarde.',
    'auth/user-disabled':            'Esta cuenta fue deshabilitada.',
    'auth/network-request-failed':   'Error de conexión. Revisá tu internet.',
  };
  return errors[code] ?? 'Ocurrió un error. Intentá de nuevo.';
}