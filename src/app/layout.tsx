import type { Metadata } from 'next';
import './styles/globals.css';
import Navbar from './components/Navbar';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider } from './context/AuthContext';
import Footer from './components/Footer';
import { ExchangeRateProvider } from './context/ExchangeRateContext';

export const metadata: Metadata = {
  title: 'Control de Gastos',
  description: 'Aplicación para gestionar tus finanzas personales',
};

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ExchangeRateProvider>
          <FinanceProvider>
            <Navbar />
            {children}
            <Footer />
          </FinanceProvider>
          </ExchangeRateProvider>
        </AuthProvider>

      </body>
    </html>
  );
}