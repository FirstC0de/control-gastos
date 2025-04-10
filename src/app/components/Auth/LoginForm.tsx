'use client';
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    const res = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    if (res?.error) setError(res.error);
    if (res?.ok) router.push('/');
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && <div className="text-red-500">{error}</div>}
      
      <div>
        <label>Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      
      <div>
        <label>Contraseña</label>
        <input
          name="password"
          type="password"
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Ingresar
      </button>
    </form>
  );
}