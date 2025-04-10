import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './styles/globals.css';
import Navbar from './components/Navbar';
import { FinanceProvider } from './context/FinanceContext';
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Control de Gastos',
  description: 'Aplicación para gestionar tus finanzas personales',
};

// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* Client Component que envuelve todo */}
        <Providers>
        <FinanceProvider>
          {/* Navbar puede ser Server Component si no usa hooks */}
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
           
          </main>
         
        </FinanceProvider>
        </Providers>
      </body>
    </html>
  );
}