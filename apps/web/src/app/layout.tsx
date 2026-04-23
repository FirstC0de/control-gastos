import type { Metadata } from 'next';
import './styles/globals.css';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider } from './context/AuthContext';
import { ExchangeRateProvider } from './context/ExchangeRateContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Controlados $ — Gestión de gastos',
  description: 'Controlá tus finanzas personales con claridad total. Importá extractos PDF, categorizá gastos y visualizá tu balance en tiempo real.',
};

const promiseTryPolyfill = `if(typeof Promise.try==='undefined'){Promise.try=function(fn){var args=Array.prototype.slice.call(arguments,1);return new Promise(function(resolve,reject){try{resolve(fn.apply(null,args));}catch(e){reject(e);}});};}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: promiseTryPolyfill }} />
      </head>
      <body>
        <AuthProvider>
          <ExchangeRateProvider>
            <FinanceProvider>
              <NotificationProvider>
                {children}
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    style: { fontFamily: 'Inter, sans-serif' },
                  }}
                />
              </NotificationProvider>
            </FinanceProvider>
          </ExchangeRateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
