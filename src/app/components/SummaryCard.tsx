'use client';

import Link from 'next/link';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';

const ExternalIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);
const RepeatIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function SummaryCard() {
  const { monthlyExpenses, categories, monthlyBudgets } = useFinance();
  const { blue } = useExchangeRate();

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  // ── Gastos por categoría (USD → ARS) ──────────────────
  const expensesByCategory = monthlyExpenses.reduce((acc, expense) => {
    const cat    = categories.find(c => c.id === expense.categoryId);
    const name   = cat?.name  || 'Sin categoría';
    const color  = cat?.color || '#94a3b8';
    const amount = expense.currency === 'USD' ? expense.amount * (blue || 0) : expense.amount;
    if (!acc[name]) acc[name] = { amount: 0, color };
    acc[name].amount += amount;
    return acc;
  }, {} as Record<string, { amount: number; color: string }>);

  // ── Presupuestos con progreso ─────────────────────────
  const budgetsWithData = monthlyBudgets.map(b => {
    const cat     = categories.find(c => c.id === b.categoryId);
    const spent   = monthlyExpenses
      .filter(e => e.categoryId === b.categoryId)
      .reduce((s, e) => s + (e.currency === 'USD' ? e.amount * (blue || 0) : e.amount), 0);
    const remaining  = b.amount - spent;
    const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    return { ...b, cat, spent, remaining, percentage };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">

      {/* ── Presupuestos ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Presupuestos</h3>
          <Link
            href="/ingresos?tab=budgets"
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Gestionar
            <ExternalIcon />
          </Link>
        </div>

        {budgetsWithData.length === 0 ? (
          <div className="text-center py-6 px-2">
            <p className="text-2xl mb-1">📊</p>
            <p className="text-xs text-slate-400">Sin presupuestos este mes</p>
            <Link
              href="/ingresos?tab=budgets"
              className="mt-2 inline-block text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
            >
              Crear presupuesto
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {budgetsWithData.map(b => (
              <div
                key={b.id}
                className="rounded-xl border border-slate-100 p-3"
                style={{ borderLeftColor: b.cat?.color, borderLeftWidth: 3 }}
              >
                {!b.cat && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mb-2">
                    ⚠ Sin categoría
                  </p>
                )}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900">{b.name}</p>
                      {b.recurring && (
                        <span className="text-indigo-400" title="Recurrente"><RepeatIcon /></span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {b.cat
                        ? <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: b.cat.color + '22', color: b.cat.color }}>
                            {b.cat.name}
                          </span>
                        : <span className="text-xs text-amber-500">Sin categoría</span>
                      }
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-semibold font-mono tabular-nums text-slate-700">${fmt(b.amount)}</span>
                    </div>
                  </div>
                </div>
                {b.cat && (
                  <>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs text-slate-400 font-mono tabular-nums">
                        <span className="font-semibold text-slate-700">${fmt(b.spent)}</span>
                        <span className="text-slate-300"> / ${fmt(b.amount)}</span>
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${b.percentage > 80 ? 'text-rose-600' : b.percentage > 50 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {b.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${b.percentage > 80 ? 'bg-rose-500' : b.percentage > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1.5 font-bold font-mono tabular-nums ${b.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {b.remaining >= 0 ? `$${fmt(b.remaining)} disponible` : `$${fmt(Math.abs(b.remaining))} excedido`}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Gastos por categoría ────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Por categoría</h3>
        {Object.keys(expensesByCategory).length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Sin gastos registrados</p>
        ) : (() => {
          const sorted    = Object.entries(expensesByCategory).sort((a, b) => b[1].amount - a[1].amount);
          const maxAmount = sorted[0]?.[1].amount || 1;
          const totalCat  = sorted.reduce((s, [, d]) => s + d.amount, 0);
          return (
            <div className="space-y-3">
              {sorted.map(([name, data]) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                      <span className="text-xs font-medium text-slate-700 truncate">{name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-sm font-bold font-mono tabular-nums text-slate-900">${fmt(data.amount)}</span>
                      <span className="text-xs text-slate-400 tabular-nums w-8 text-right">
                        {(data.amount / totalCat * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1">
                    <div className="h-1 rounded-full transition-all"
                      style={{ width: `${(data.amount / maxAmount) * 100}%`, backgroundColor: data.color }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500">Total gastos</span>
                <span className="text-sm font-bold font-mono tabular-nums text-slate-900">${fmt(totalCat)}</span>
              </div>
            </div>
          );
        })()}
      </div>

    </div>
  );
}
