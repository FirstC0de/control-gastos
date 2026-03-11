'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface ExchangeRate {
  blue: number;
  oficial: number;
  lastUpdated: string;
  loading: boolean;
  error: string;
  refresh: () => void;
}

const ExchangeRateContext = createContext<ExchangeRate>({
  blue: 0, oficial: 0, lastUpdated: '', loading: true, error: '', refresh: () => {},
});

export const useExchangeRate = () => useContext(ExchangeRateContext);

export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
  const [blue, setBlue]           = useState(0);
  const [oficial, setOficial]     = useState(0);
  const [lastUpdated, setUpdated] = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const fetchRate = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('https://api.bluelytics.com.ar/v2/latest');
      const data = await res.json();
      setBlue(data.blue?.value_sell ?? 0);
      setOficial(data.oficial?.value_sell ?? 0);
      setUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setError('No se pudo obtener la cotización');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
    // Refrescar cada 30 minutos
    const interval = setInterval(fetchRate, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ExchangeRateContext.Provider value={{ blue, oficial, lastUpdated, loading, error, refresh: fetchRate }}>
      {children}
    </ExchangeRateContext.Provider>
  );
}