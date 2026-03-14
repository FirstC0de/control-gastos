'use client';

import Link from 'next/link';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';

const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function SavingsDashboardWidget() {
  const { savings, getSavingsSummary } = useFinance();
  const { blue } = useExchangeRate();

  if (savings.length === 0) return null;

  const summary = getSavingsSummary();
  const goals   = savings.filter(s => s.type === 'goal' && s.goalAmount && s.goalAmount > 0);
  const topGoal = goals.sort((a, b) => {
    const pctA = a.goalAmount ? a.balance / a.goalAmount : 0;
    const pctB = b.goalAmount ? b.balance / b.goalAmount : 0;
    return pctB - pctA;
  })[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Ahorros</p>
        <Link
          href="/ahorros"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
        >
          Ver todo →
        </Link>
      </div>

      {/* Total */}
      <div>
        <p className="text-2xl font-bold text-emerald-600 font-mono">${fmt(summary.totalConverted)}</p>
        <p className="text-xs text-slate-400 mt-0.5">ARS total · {savings.length} cuenta{savings.length !== 1 ? 's' : ''}</p>
      </div>

      {/* ARS + USD breakdown */}
      <div className="flex gap-4">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Pesos</p>
          <p className="text-sm font-bold font-mono text-slate-800">${fmt(summary.totalARS)}</p>
        </div>
        {summary.totalUSD > 0 && (
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Dólares</p>
            <p className="text-sm font-bold font-mono text-slate-800">
              U$D {summary.totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {blue && <p className="text-[10px] text-slate-400 font-mono">≈ ${fmt(summary.totalUSD * blue)}</p>}
          </div>
        )}
      </div>

      {/* Meta destacada */}
      {topGoal && topGoal.goalAmount && (
        <div className="pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-slate-600 font-medium truncate pr-2">{topGoal.name}</p>
            <span className="text-xs font-bold shrink-0" style={{ color: topGoal.color }}>
              {Math.round((topGoal.balance / topGoal.goalAmount) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (topGoal.balance / topGoal.goalAmount) * 100)}%`,
                backgroundColor: topGoal.color,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            ${fmt(topGoal.balance)} / ${fmt(topGoal.goalAmount)}
          </p>
        </div>
      )}
    </div>
  );
}
