'use client';

import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

const fmt = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

export default function RendimientosTab() {
  const { getFixedTermStatus, getInvestmentStatus, getSavingsSummary } = useFinance();
  const { blue } = useExchangeRate();
  const [inflationRate, setInflationRate] = useState(3.5); // % mensual default

  const toARS = (v: number, currency: string) => currency === 'USD' ? v * (blue || 1) : v;

  const ftStatuses  = getFixedTermStatus();
  const invStatuses = getInvestmentStatus();
  const savings     = getSavingsSummary();

  const annualInflation = ((1 + inflationRate / 100) ** 12 - 1) * 100;

  // Fixed term returns data
  const ftChartData = ftStatuses.map(({ fixedTerm: ft, projectedInterest, daysTotal }) => {
    const returnPct = ft.principal > 0 ? (projectedInterest / ft.principal) * 100 : 0;
    const annualizedReturn = daysTotal > 0 ? (returnPct / daysTotal) * 365 : 0;
    return {
      name: ft.institution.length > 10 ? ft.institution.slice(0, 8) + '…' : ft.institution,
      'Rendimiento TNA': ft.rate,
      'Inflación anual': annualInflation,
      beat: ft.rate > annualInflation,
    };
  });

  // Investment returns data
  const invChartData = invStatuses.map(({ investment: inv, unrealizedGainPct }) => ({
    name: (inv.ticker || inv.name).length > 10 ? (inv.ticker || inv.name).slice(0, 8) + '…' : (inv.ticker || inv.name),
    'Rendimiento': unrealizedGainPct,
    'Inflación anual': annualInflation,
    beat: unrealizedGainPct > annualInflation,
  }));

  // Summary cards
  const totalFixedInterest = ftStatuses.reduce((s, x) => s + toARS(x.projectedInterest, x.fixedTerm.currency), 0);
  const totalInvGain       = invStatuses.reduce((s, x) => s + toARS(x.unrealizedGain, x.investment.currency), 0);
  const totalPortfolio     = savings.totalConverted
    + ftStatuses.reduce((s, x) => s + toARS(x.currentValue, x.fixedTerm.currency), 0)
    + invStatuses.reduce((s, x) => s + toARS(x.currentValue, x.investment.currency), 0);

  return (
    <div className="space-y-6">
      {/* Config inflación */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Inflación de referencia</p>
            <p className="text-xs text-slate-400 mt-0.5">Para comparar rendimientos</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.1"
              value={inflationRate}
              onChange={e => setInflationRate(parseFloat(e.target.value) || 0)}
              className="w-20 text-sm font-mono border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-right"
            />
            <span className="text-sm text-slate-500 font-medium">% mensual</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-6 text-xs text-slate-500">
          <span>TNA equivalente: <span className="font-bold text-slate-700">{(inflationRate * 12).toFixed(1)}%</span></span>
          <span>Anual efectiva: <span className="font-bold text-slate-700">{annualInflation.toFixed(1)}%</span></span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Portfolio total</p>
          <p className="text-2xl font-bold text-slate-900 font-mono">${fmt(totalPortfolio)}</p>
          <p className="text-xs text-slate-400 mt-1">Ahorros + plazos fijos + inversiones</p>
        </div>
        <div className={`rounded-2xl border p-5 ${totalFixedInterest >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Interés proyectado PF</p>
          <p className="text-2xl font-bold text-blue-700 font-mono">+${fmt(totalFixedInterest)}</p>
          <p className="text-xs text-blue-500 mt-1">{ftStatuses.length} plazo{ftStatuses.length !== 1 ? 's' : ''} fijo{ftStatuses.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${totalInvGain >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${totalInvGain >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Plusvalía inversiones</p>
          <p className={`text-2xl font-bold font-mono ${totalInvGain >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {totalInvGain >= 0 ? '+' : ''}{fmt(totalInvGain)}
          </p>
          <p className={`text-xs mt-1 ${totalInvGain >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>{invStatuses.length} posición{invStatuses.length !== 1 ? 'es' : ''}</p>
        </div>
      </div>

      {/* Chart: Plazos fijos vs inflación */}
      {ftChartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">
            Plazos fijos — TNA vs Inflación anual
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ftChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <ReferenceLine y={annualInflation} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Inflación', fontSize: 10, fill: '#92400e' }} />
              <Bar dataKey="Rendimiento TNA" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {ftChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.beat ? '#3b82f6' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart: Inversiones vs inflación */}
      {invChartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">
            Inversiones — Rendimiento no realizado vs Inflación
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={invChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <ReferenceLine y={annualInflation} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Inflación', fontSize: 10, fill: '#92400e' }} />
              <ReferenceLine y={0} stroke="#cbd5e1" />
              <Bar dataKey="Rendimiento" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {invChartData.map((entry, i) => (
                  <Cell key={i} fill={entry['Rendimiento'] >= 0 ? (entry.beat ? '#10b981' : '#a78bfa') : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-3 text-[10px]">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-slate-500">Le gana a la inflación</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-violet-400" /><span className="text-slate-500">Positivo pero bajo la inflación</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-400" /><span className="text-slate-500">En rojo</span></div>
          </div>
        </div>
      )}

      {/* Tabla detalle */}
      {(ftStatuses.length > 0 || invStatuses.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Detalle por instrumento</p>
          </div>
          <div className="divide-y divide-slate-100">
            {ftStatuses.map(({ fixedTerm: ft, projectedInterest, daysTotal }) => {
              const ret = ft.principal > 0 ? (projectedInterest / ft.principal) * 100 : 0;
              return (
                <div key={ft.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold shrink-0">PF</span>
                  <span className="flex-1 text-xs text-slate-700 truncate">{ft.institution}</span>
                  <span className="text-xs font-mono text-slate-500">{ft.rate}% TNA</span>
                  <span className="text-xs font-mono font-semibold text-emerald-600 w-20 text-right">+${fmt(projectedInterest)}</span>
                  <span className={`text-xs font-semibold w-16 text-right ${ft.rate > annualInflation ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {ft.rate > annualInflation ? '↑ inf.' : '↓ inf.'}
                  </span>
                </div>
              );
            })}
            {invStatuses.map(({ investment: inv, unrealizedGain, unrealizedGainPct }) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 font-semibold shrink-0">INV</span>
                <span className="flex-1 text-xs text-slate-700 truncate">{inv.name}{inv.ticker ? ` · ${inv.ticker}` : ''}</span>
                <span className="text-xs font-mono text-slate-500">{inv.quantity} u.</span>
                <span className={`text-xs font-mono font-semibold w-20 text-right ${unrealizedGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {unrealizedGain >= 0 ? '+' : ''}{fmt(toARS(unrealizedGain, inv.currency))}
                </span>
                <span className={`text-xs font-semibold w-16 text-right ${unrealizedGainPct > annualInflation ? 'text-emerald-600' : unrealizedGainPct >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {unrealizedGainPct > annualInflation ? '↑ inf.' : unrealizedGainPct >= 0 ? '↓ inf.' : '↓ 0%'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ftStatuses.length === 0 && invStatuses.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
          <p className="text-sm font-semibold text-slate-700 mb-1">Sin datos de rendimiento</p>
          <p className="text-xs text-slate-400">Agregá plazos fijos o inversiones para ver el análisis.</p>
        </div>
      )}
    </div>
  );
}
