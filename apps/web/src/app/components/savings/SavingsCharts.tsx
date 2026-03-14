'use client';

import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import type { SavingType } from '@controlados/shared';

const TYPE_LABELS: Record<SavingType, string> = {
  account: 'Cuentas bancarias',
  wallet:  'Billeteras',
  cash:    'Efectivo',
  goal:    'Metas',
};

const TYPE_COLORS: Record<SavingType, string> = {
  account: '#3b82f6',
  wallet:  '#8b5cf6',
  cash:    '#10b981',
  goal:    '#f59e0b',
};

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}k`
    : `$${n.toFixed(0)}`;

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-800">{payload[0].name}</p>
      <p className="text-slate-600 font-mono">${payload[0].value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
    </div>
  );
};

export default function SavingsCharts() {
  const { savings, getSavingsSummary } = useFinance();
  const { blue } = useExchangeRate();

  const summary = getSavingsSummary();
  const toARS = (s: { balance: number; currency: string }) =>
    s.currency === 'USD' ? s.balance * (blue || 1) : s.balance;

  // Datos por tipo
  const byTypeData = (Object.keys(TYPE_LABELS) as SavingType[])
    .map(t => ({
      name:  TYPE_LABELS[t],
      value: summary.byType[t] ?? 0,
      color: TYPE_COLORS[t],
    }))
    .filter(d => d.value > 0);

  // Datos ARS vs USD
  const currencyData = [
    { name: 'Pesos (ARS)', value: summary.totalARS,              color: '#3b82f6' },
    { name: 'Dólares (conv.)', value: summary.totalUSD * (blue || 1), color: '#10b981' },
  ].filter(d => d.value > 0);

  // Datos por cuenta (top 8)
  const byAccountData = [...savings]
    .sort((a, b) => toARS(b) - toARS(a))
    .slice(0, 8)
    .map(s => ({
      name:  s.name.length > 14 ? s.name.slice(0, 12) + '…' : s.name,
      value: Math.round(toARS(s)),
      color: s.color,
    }));

  if (savings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
        <p className="text-sm font-semibold text-slate-700 mb-1">Sin datos para mostrar</p>
        <p className="text-xs text-slate-400">Agregá ahorros para ver los gráficos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Pie charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Por tipo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Distribución por tipo</p>
          {byTypeData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={byTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {byTypeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {byTypeData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-semibold font-mono text-slate-700">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Sin datos</p>
          )}
        </div>

        {/* ARS vs USD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Por moneda (en ARS)</p>
          {currencyData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={currencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {currencyData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {currencyData.map((d, i) => {
                  const pct = summary.totalConverted > 0 ? (d.value / summary.totalConverted) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold font-mono text-slate-700">{fmt(d.value)}</span>
                        <span className="text-slate-400 ml-1">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Sin datos</p>
          )}
        </div>
      </div>

      {/* Row 2: Bar chart por cuenta */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Balance por cuenta (ARS)</p>
        {byAccountData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byAccountData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString('es-AR')}`, 'Balance']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {byAccountData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-slate-400 text-center py-8">Sin datos</p>
        )}
      </div>
    </div>
  );
}
