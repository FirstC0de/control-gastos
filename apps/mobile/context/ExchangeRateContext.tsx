import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ExchangeRateContextType = {
  blue: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const ExchangeRateContext = createContext<ExchangeRateContextType>({
  blue: null, loading: true, refresh: async () => {},
});

const fetchBlue = () =>
  fetch('https://api.bluelytics.com.ar/v2/latest')
    .then(r => r.json())
    .then(data => data?.blue?.value_sell ?? null)
    .catch(() => null);

export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
  const [blue, setBlue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const value = await fetchBlue();
    setBlue(value);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, []);

  return (
    <ExchangeRateContext.Provider value={{ blue, loading, refresh }}>
      {children}
    </ExchangeRateContext.Provider>
  );
}

export const useExchangeRate = () => useContext(ExchangeRateContext);
