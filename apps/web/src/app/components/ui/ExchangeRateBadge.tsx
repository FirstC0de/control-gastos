'use client';

import { useExchangeRate } from '../../context/ExchangeRateContext';

export default function ExchangeRateBadge() {
  const { blue, oficial, lastUpdated, loading, error, refresh } = useExchangeRate();

  if (loading) return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg animate-pulse">
      <div className="w-16 h-3 bg-slate-300 rounded" />
    </div>
  );

  if (error) return (
    <button onClick={refresh}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-lg hover:bg-rose-100 transition-colors">
      ⚠️ Sin cotización · Reintentar
    </button>
  );

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-400">Oficial</span>
        <span className="text-xs font-semibold text-slate-700">${oficial.toLocaleString('es-AR')}</span>
      </div>
      <div className="w-px h-3 bg-slate-300" />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-400">Blue</span>
        <span className="text-xs font-semibold text-emerald-700">${blue.toLocaleString('es-AR')}</span>
      </div>
      {lastUpdated && (
        <>
          <div className="w-px h-3 bg-slate-300" />
          <span className="text-xs text-slate-400">{lastUpdated}</span>
        </>
      )}
      <button onClick={refresh} className="text-slate-400 hover:text-slate-600 transition-colors text-xs">
        ↻
      </button>
    </div>
  );
}