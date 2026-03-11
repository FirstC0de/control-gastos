import type { Metadata } from 'next';
import './styles/globals.css';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider } from './context/AuthContext';
import { ExchangeRateProvider } from './context/ExchangeRateContext';

export const metadata: Metadata = {
  title: 'Controlados $ — Gestión de gastos',
  description: 'Controlá tus finanzas personales con claridad total. Importá extractos PDF, categorizá gastos y visualizá tu balance en tiempo real.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ExchangeRateProvider>
            <FinanceProvider>
              {children}
            </FinanceProvider>
          </ExchangeRateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
