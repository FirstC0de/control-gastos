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

  const inputClass = "block w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";
  const btnClass = "flex w-full justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getFirebaseError((err as { code: string }).code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormContainer
      title="Iniciar sesión"
      subtitle="Ingresá tus credenciales para acceder a tu cuenta"
      footerText="¿No tenés una cuenta?"
      footerLink="/registro"
      footerLinkText="Registrate"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl bg-red-500/15 border border-red-500/25 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>Correo electrónico</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              id="remember-me"
              type="checkbox"
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <label htmlFor="remember-me" className="text-sm text-slate-400">Recordarme</label>
          </div>
          <Link href="/olvide-contrasena" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button type="submit" disabled={loading} className={btnClass}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Ingresando...
            </span>
          ) : 'Iniciar sesión'}
        </button>
      </form>

      <AuthSocialButtons />
    </AuthFormContainer>
  );
}

function getFirebaseError(code: string): string {
  const errors: Record<string, string> = {
    'auth/invalid-credential':     'Email o contraseña incorrectos.',
    'auth/user-not-found':         'No existe una cuenta con ese email.',
    'auth/wrong-password':         'Contraseña incorrecta.',
    'auth/too-many-requests':      'Demasiados intentos. Intentá más tarde.',
    'auth/user-disabled':          'Esta cuenta fue deshabilitada.',
    'auth/network-request-failed': 'Error de conexión. Revisá tu internet.',
  };
  return errors[code] ?? 'Ocurrió un error. Intentá de nuevo.';
}
