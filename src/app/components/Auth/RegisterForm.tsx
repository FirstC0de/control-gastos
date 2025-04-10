'use client';
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          name: formData.get('name'),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      
      router.push('/auth/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
     <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && <div className="text-red-500">{error}</div>}
      <div>
        <label>Nombre</label>
        <input
          name="name"
          type="text"
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
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
        Registrar
      </button>
    </form>
  );
}
