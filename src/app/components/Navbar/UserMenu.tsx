'use client';
import { signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function UserMenu({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.refresh(); // Forzar recarga del cliente
    router.push('/auth/login');
  };
  return (
    <div className="relative ml-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center max-w-xs rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <img
          src={user.image || '/vercel.svg'}
          alt="Avatar"
          className="h-8 w-8 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/vercel.svg';
          }}
        />
        <span className="ml-2 hidden md:inline-block text-sm font-medium text-gray-700">
          {user.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Link
            href="/perfil"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Mi Perfil
          </Link>
          <Link
            href="/configuracion"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Configuración
          </Link>
          <button onClick={handleLogout} className="...">
            Cerrar sesión
          </button>
        </div>
      )}


    </div>
  );
}