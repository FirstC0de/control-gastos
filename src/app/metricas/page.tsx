'use client';

import AppShell from '../components/AppShell';
import MonthNavigator from '../components/ui/MonthNavigator';
import ExchangeRateBadge from '../components/ui/ExchangeRateBadge';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Sector,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

// ── Paleta de colores para categorías ────────────────────
const CAT_COLORS = [
  '#6366f1', '#f43f5e', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtARS(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

function fmtFull(n: number): string {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

// ── Custom Tooltip evolución ──────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-800">{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Sector activo del donut ───────────────────────────────
function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  const label: string = payload.name.length > 12 ? payload.name.slice(0, 12) + '…' : payload.name;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: '#1e293b' }}>
        {label}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 12, fill: '#64748b' }}>
        {(payload.pct as number).toFixed(1)}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

// ── MetricCard ────────────────────────────────────────────
type MetricColor = 'emerald' | 'rose' | 'indigo' | 'amber';

function MetricCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: MetricColor; icon: React.ReactNode;
}) {
  const styles: Record<MetricColor, { icon: string; text: string }> = {
    emerald: { icon: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700' },
    rose:    { icon: 'bg-rose-100 text-rose-600',       text: 'text-rose-700'    },
    indigo:  { icon: 'bg-indigo-100 text-indigo-600',   text: 'text-indigo-700'  },
    amber:   { icon: 'bg-amber-100 text-amber-600',     text: 'text-amber-700'   },
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${styles[color].icon}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold font-mono tracking-tight ${styles[color].text}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────
export default function MetricasPage() {
  const { expenses, incomes, categories, selectedMonth } = useFinance();
  const { blue } = useExchangeRate();
  const [periodMonths, setPeriodMonths] = useState<3 | 6 | 12>(6);
  const [activePieIdx, setActivePieIdx] = useState(0);

  const toARS = (amount: number, currency?: string): number =>
    currency === 'USD' ? amount * (blue ?? 0) : amount;

  // ── Métricas del mes actual ──────────────────────────────
  const { totalInc, totalExp, balance, savingsRate } = useMemo(() => {
    const key = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
    const mExp = expenses.filter(e => (e.monthYear ?? e.date.substring(0, 7)) === key);
    const mInc = incomes.filter(i => i.date.substring(0, 7) === key);
    const totalInc = mInc.reduce((s, i) => s + toARS(i.amount, i.currency), 0);
    const totalExp = mExp.reduce((s, e) => s + toARS(e.amount, e.currency), 0);
    const balance  = totalInc - totalExp;
    const savingsRate = totalInc > 0 ? (balance / totalInc) * 100 : 0;
    return { totalInc, totalExp, balance, savingsRate };
  }, [expenses, incomes, selectedMonth, blue]);

  // ── Datos evolución mensual ──────────────────────────────
  const evolutionData = useMemo(() => {
    const months: { year: number; month: number }[] = [];
    for (let i = periodMonths - 1; i >= 0; i--) {
      let m = selectedMonth.month - i;
      let y = selectedMonth.year;
      while (m < 0) { m += 12; y--; }
      months.push({ year: y, month: m });
    }
    return months.map(({ year, month }) => {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const mExp = expenses.filter(e => (e.monthYear ?? e.date.substring(0, 7)) === key);
      const mInc = incomes.filter(i => i.date.substring(0, 7) === key);
      return {
        name: `${MONTH_LABELS[month]} ${String(year).slice(2)}`,
        Ingresos: mInc.reduce((s, i) => s + toARS(i.amount, i.currency), 0),
        Gastos:   mExp.reduce((s, e) => s + toARS(e.amount, e.currency), 0),
      };
    });
  }, [expenses, incomes, selectedMonth, periodMonths, blue]);

  // ── Datos donut categorías ───────────────────────────────
  const pieData = useMemo(() => {
    const key = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
    const mExp = expenses.filter(e => (e.monthYear ?? e.date.substring(0, 7)) === key);
    const byCat: Record<string, number> = {};
    for (const e of mExp) {
      const cat = categories.find(c => c.id === e.categoryId);
      const name = cat?.name ?? 'Sin categoría';
      byCat[name] = (byCat[name] ?? 0) + toARS(e.amount, e.currency);
    }
    const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const total  = sorted.reduce((s, [, v]) => s + v, 0);
    const top5   = sorted.slice(0, 5);
    const otros  = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
    const items  = otros > 0 ? [...top5, ['Otros', otros] as [string, number]] : top5;
    return items.map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total) * 100 : 0 }));
  }, [expenses, categories, selectedMonth, blue]);

  // ── Últimas transacciones ────────────────────────────────
  const recentExpenses = useMemo(() => {
    const key = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
    return expenses
      .filter(e => (e.monthYear ?? e.date.substring(0, 7)) === key)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [expenses, selectedMonth]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Métricas</h1>
            <p className="text-sm text-slate-400 mt-0.5">Análisis visual de tu actividad financiera</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <MonthNavigator />
            <ExchangeRateBadge />
          </div>
        </div>

        {/* Cards de resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Ingresos del mes" value={fmtARS(totalInc)}
            sub={totalInc > 0 ? fmtFull(totalInc) : 'Sin ingresos'} color="emerald"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
          />
          <MetricCard label="Gastos del mes" value={fmtARS(totalExp)}
            sub={totalExp > 0 ? fmtFull(totalExp) : 'Sin gastos'} color="rose"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" /></svg>}
          />
          <MetricCard label="Saldo disponible" value={fmtARS(balance)}
            sub={balance >= 0 ? 'Superávit' : 'Déficit'} color={balance >= 0 ? 'indigo' : 'rose'}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97z" /></svg>}
          />
          <MetricCard label="Tasa de ahorro"
            value={totalInc > 0 ? `${savingsRate.toFixed(1)}%` : '—'}
            sub={totalInc > 0 ? `${fmtARS(balance)} ahorrado` : 'Sin ingresos registrados'}
            color={savingsRate >= 20 ? 'emerald' : savingsRate >= 0 ? 'amber' : 'rose'}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Evolución mensual */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex items-center justify-end px-6 py-4 rounded-t-2xl bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-indigo-100">
              <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-indigo-900 tracking-tight whitespace-nowrap">
                Evolución mensual
              </h2>
              <div className="flex gap-1 bg-white/70 border border-slate-200 rounded-xl p-0.5 relative z-10">
                {([3, 6, 12] as const).map(m => (
                  <button key={m} onClick={() => setPeriodMonths(m)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      periodMonths === m ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={evolutionData} barCategoryGap="30%" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtARS} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastos"   fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut categorías */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex items-center px-6 py-4 rounded-t-2xl bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-indigo-100">
              <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-indigo-900 tracking-tight whitespace-nowrap">
                Por categoría
              </h2>
            </div>
            <div className="p-5">
              {pieData.length === 0 ? (
                <EmptyState text="Sin gastos este mes" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      {(() => {
                        const PieAny = Pie as any;
                        return (
                          <PieAny data={pieData} cx="50%" cy="50%"
                            innerRadius={55} outerRadius={80} dataKey="value"
                            activeIndex={activePieIdx} activeShape={renderActiveShape}
                            onMouseEnter={(_: unknown, idx: number) => setActivePieIdx(idx)}
                          >
                            {pieData.map((_: unknown, i: number) => (
                              <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                            ))}
                          </PieAny>
                        );
                      })()}
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-3 space-y-2">
                    {pieData.map((d, i) => (
                      <li key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                          <span className="text-slate-600 truncate">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="font-semibold font-mono text-slate-800">{fmtARS(d.value)}</span>
                          <span className="text-slate-400 w-9 text-right">{d.pct.toFixed(0)}%</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Últimas transacciones */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex items-center px-6 py-4 rounded-t-2xl bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-indigo-100">
            <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-indigo-900 tracking-tight whitespace-nowrap">
              Últimas transacciones
            </h2>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-400">Sin gastos registrados este mes</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentExpenses.map(e => {
                const cat   = categories.find(c => c.id === e.categoryId);
                const isUSD = e.currency === 'USD';
                return (
                  <li key={e.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50/70 transition-colors">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: (cat?.color ?? '#cbd5e1') + '20' }}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat?.color ?? '#cbd5e1' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{e.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-400">
                          {new Date(e.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </span>
                        {cat && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: cat.color + '18', color: cat.color }}>
                            {cat.name}
                          </span>
                        )}
                        {e.installments && e.installments > 1 && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium border border-amber-100">
                            Cuota {e.currentInstallment}/{e.installments}
                          </span>
                        )}
                        {e.recurring && (
                          <span className="text-xs px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded-full font-medium border border-sky-100">
                            Recurrente
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold font-mono ${isUSD ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {isUSD ? 'U$D ' : '$'}{e.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                      {isUSD && (blue ?? 0) > 0 && (
                        <p className="text-xs text-slate-400 font-mono">≈ {fmtARS(e.amount * (blue ?? 0))}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </AppShell>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 gap-2">
      <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm">{text}</p>
    </div>
  );
}
