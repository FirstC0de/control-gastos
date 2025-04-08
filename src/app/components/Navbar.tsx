import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          Control Gastos
        </Link>
        <div className="flex gap-4">
          <Link 
            href="/" 
            className="px-3 py-2 hover:bg-gray-100 rounded"
          >
            Dashboard
          </Link>
          <Link
            href="/ingresos"
            className="px-3 py-2 hover:bg-gray-100 rounded"
          >
            Ingresos
          </Link>
        </div>
      </div>
    </nav>
  );
}