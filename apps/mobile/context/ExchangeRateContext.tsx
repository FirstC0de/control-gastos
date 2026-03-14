import React, { createContext, useContext, useEffect, useState } from 'react';

type ExchangeRateContextType = {
  blue: number | null;
  loading: boolean;
};

const ExchangeRateContext = createContext<ExchangeRateContextType>({ blue: null, loading: true });

export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
  const [blue, setBlue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.bluelytics.com.ar/v2/latest')
      .then(r => r.json())
      .then(data => setBlue(data?.blue?.value_sell ?? null))
      .catch(() => setBlue(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ExchangeRateContext.Provider value={{ blue, loading }}>
      {children}
    </ExchangeRateContext.Provider>
  );
}

export const useExchangeRate = () => useContext(ExchangeRateContext);
