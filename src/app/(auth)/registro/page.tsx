'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '@/app/context/AuthContext';
import { auth } from '@/app/lib/firebase';
import AuthFormContainer from '@/app/components/Auth/AuthFormContainer';
import AuthSocialButtons from '@/app/components/Auth/AuthSocialButtons';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reemplazás todas las clases de inputs en login/page.tsx y registro/page.tsx por:
  const inputClass = "block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow";

  // Labels:
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  // Botón principal:
  const btnClass = "flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      // Guardar el nombre en el perfil de Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }
      router.push('/');
    } catch (err: unknown) {
      setError(getFirebaseError((err as { code: string }).code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormContainer
      title="Crear una cuenta"
      subtitle="Comienza a controlar tus gastos hoy mismo"
      footerText="¿Ya tienes una cuenta?"
      footerLink="/login"
      footerLinkText="Inicia sesión"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className={labelClass}>
            Nombre completo
          </label>
          <div className="mt-2">
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
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
          <label htmlFor="password" className={labelClass}>
            Contraseña
          </label>
          <div className="mt-2">
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className={labelClass}>
            Confirmar contraseña
          </label>
          <div className="mt-2">
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            type="checkbox"
            required
            className={inputClass}
          />
          <label htmlFor="terms" className={labelClass}>
            Acepto los{' '}
            <Link href="/terminos" className="text-indigo-600 hover:text-indigo-500">
              términos y condiciones
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={btnClass}
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>

      <AuthSocialButtons />
    </AuthFormContainer>
  );
}

function getFirebaseError(code: string): string {
  const errors: Record<string, string> = {
    'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
    'auth/invalid-email': 'El email ingresado no es válido.',
    'auth/weak-password': 'La contraseña es demasiado débil.',
    'auth/network-request-failed': 'Error de conexión. Revisá tu internet.',
  };
  return errors[code] ?? 'Ocurrió un error. Intentá de nuevo.';
}