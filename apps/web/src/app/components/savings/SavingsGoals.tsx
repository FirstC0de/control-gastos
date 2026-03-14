'use client';

import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Saving } from '@controlados/shared';
import TransactionModal from './TransactionModal';

const fmt     = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec  = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function estimateMonthsLeft(saving: Saving): string | null {
  if (!saving.goalAmount || saving.balance >= saving.goalAmount) return null;
  const contrib = saving.monthlyContribution;
  if (!contrib || contrib <= 0) return null;
  const remaining = saving.goalAmount - saving.balance;
  const months = Math.ceil(remaining / contrib);
  if (months <= 0) return null;
  const target = new Date();
  target.setMonth(target.getMonth() + months);
  return target.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

function GoalCard({ saving, onTransact }: { saving: Saving; onTransact: () => void }) {
  const progress = saving.goalAmount && saving.goalAmount > 0
    ? Math.min(100, (saving.balance / saving.goalAmount) * 100)
    : 0;
  const isComplete = progress >= 100;
  const estimatedDate = estimateMonthsLeft(saving);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
            style={{ backgroundColor: saving.color + '22', border: `2px solid ${saving.color}40` }}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: saving.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{saving.name}</p>
            {saving.institution && (
              <p className="text-xs text-slate-400">{saving.institution}</p>
            )}
          </div>
        </div>
        {isComplete ? (
          <span className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            ¡Completada!
          </span>
        ) : (
          <button
            onClick={onTransact}
            className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl transition-colors"
          >
            + Aportar
          </button>
        )}
      </div>

      {/* Montos */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Acumulado</p>
          <p className="text-lg font-bold font-mono text-slate-900">
            {saving.currency === 'USD' ? 'U$D ' : '$'}{fmtDec(saving.balance)}
          </p>
        </div>
        {saving.goalAmount && (
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Objetivo</p>
            <p className="text-lg font-bold font-mono text-slate-500">
              {saving.currency === 'USD' ? 'U$D ' : '$'}{fmt(saving.goalAmount)}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {saving.goalAmount && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">
              Faltan {saving.currency === 'USD' ? 'U$D ' : '$'}{fmt(Math.max(0, saving.goalAmount - saving.balance))}
            </span>
            <span className="text-xs font-bold" style={{ color: saving.color }}>
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: isComplete ? '#10b981' : saving.color }}
            />
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        {saving.goalDate && (
          <span>
            Fecha límite:{' '}
            <span className="text-slate-600 font-medium">
              {new Date(saving.goalDate + 'T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </span>
          </span>
        )}
        {estimatedDate && !isComplete && (
          <span>
            Estimado:{' '}
            <span className="text-emerald-700 font-medium">{estimatedDate}</span>
            {saving.monthlyContribution && (
              <span className="text-slate-400"> (${fmt(saving.monthlyContribution)}/mes)</span>
            )}
          </span>
        )}
        {!saving.monthlyContribution && !isComplete && (
          <span className="text-slate-300 italic">Definí un aporte mensual para ver la estimación</span>
        )}
      </div>
    </div>
  );
}

export default function SavingsGoals() {
  const { savings } = useFinance();
  const [transactSaving, setTransactSaving] = useState<Saving | null>(null);

  const goals = savings.filter(s => s.type === 'goal');

  if (goals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-700 mb-1">Sin metas de ahorro</p>
        <p className="text-xs text-slate-400">Creá una meta de ahorro desde "Agregar" para verla aquí.</p>
      </div>
    );
  }

  const completed = goals.filter(g => g.goalAmount && g.balance >= g.goalAmount).length;

  return (
    <div className="space-y-4">
      {completed > 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {completed} meta{completed !== 1 ? 's' : ''} completada{completed !== 1 ? 's' : ''}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goals.map(g => (
          <GoalCard
            key={g.id}
            saving={g}
            onTransact={() => setTransactSaving(g)}
          />
        ))}
      </div>
      {transactSaving && (
        <TransactionModal saving={transactSaving} onClose={() => setTransactSaving(null)} />
      )}
    </div>
  );
}
