'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import FixedTermList from './FixedTermList';
import InvestmentList from './InvestmentList';
import RendimientosTab from './RendimientosTab';

type Tab = 'plazos' | 'portafolio' | 'rendimientos';

const fmt = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default function InversionesOverview() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'plazos');

  const { getFixedTermStatus, getInvestmentStatus, getPortfolioSummary } = useFinance();
  const { blue } = useExchangeRate();

  const ftStatuses  = getFixedTermStatus();
  const invStatuses = getInvestmentStatus();
  const portfolio   = getPortfolioSummary();

  const expiringSoon = ftStatuses.filter(s => s.isExpiringSoon || s.isExpired).length;

  const toARS = (v: number, currency: string) => currency === 'USD' ? v * (blue || 1) : v;
  const totalFT  = ftStatuses.reduce((s, x) => s + toARS(x.currentValue, x.fixedTerm.currency), 0);
  const totalInv = invStatuses.reduce((s, x) => s + toARS(x.currentValue, x.investment.currency), 0);
  const totalGain = invStatuses.reduce((s, x) => s + toARS(x.unrealizedGain, x.investment.currency), 0)
    + ftStatuses.reduce((s, x) => s + toARS(x.projectedInterest, x.fixedTerm.currency), 0);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'plazos',      label: 'Plazos Fijos',  badge: expiringSoon || undefined },
    { id: 'portafolio',  label: 'Portafolio'    },
    { id: 'rendimientos',label: 'Rendimientos'  },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inversiones</h1>
        <p className="text-sm text-slate-400 mt-0.5">Plazos fijos, acciones, bonos y crypto</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Plazos fijos</p>
          <p className="text-2xl font-bold text-blue-600 font-mono">${fmt(totalFT)}</p>
          <p className="text-xs text-slate-400 mt-1">{ftStatuses.length} plazo{ftStatuses.length !== 1 ? 's' : ''} · ARS</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Portafolio</p>
          <p className="text-2xl font-bold text-violet-600 font-mono">${fmt(totalInv)}</p>
          <p className="text-xs text-slate-400 mt-1">{invStatuses.length} posición{invStatuses.length !== 1 ? 'es' : ''}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${totalGain >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${totalGain >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            Rendimiento total
          </p>
          <p className={`text-2xl font-bold font-mono ${totalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalGain >= 0 ? '+' : ''}{fmt(totalGain)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Int. proyectado + plusvalía</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.badge ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'plazos'       && <FixedTermList />}
      {tab === 'portafolio'   && <InvestmentList />}
      {tab === 'rendimientos' && <RendimientosTab />}
    </div>
  );
}
