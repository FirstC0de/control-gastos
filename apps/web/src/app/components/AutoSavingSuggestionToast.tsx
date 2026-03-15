'use client';

import { useState } from 'react';
import type { AutoSavingRule, Income } from '@controlados/shared';

interface Props {
  income: Income;
  rule: AutoSavingRule;
  savingName: string;
  onAccept: () => Promise<void>;
  onDecline: () => void;
  /** Si hay varios en cola, mostrar "1 de N" */
  queueInfo?: { current: number; total: number };
}

export default function AutoSavingSuggestionModal({ income, rule, savingName, onAccept, onDecline, queueInfo }: Props) {
  const [loading, setLoading] = useState(false);
  const suggestedAmount = Math.round(income.amount * (rule.percentage / 100));
  const currencySymbol = income.currency === 'USD' ? 'U$D' : '$';

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDecline} />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden animate-scale-in">

        {/* Header con gradiente */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-8 pb-10 text-center relative overflow-hidden">
          {/* Círculos decorativos */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />

          <div className="relative">
            {queueInfo && (
              <div className="absolute -top-2 right-0 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {queueInfo.current} de {queueInfo.total}
              </div>
            )}
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">
              🏦
            </div>
            <h2 className="text-xl font-bold text-white">¡Oportunidad de ahorro!</h2>
            <p className="text-emerald-100 text-sm mt-1">
              {income.recurring ? 'Ingreso recurrente: ' : 'Ingreso detectado: '}
              <span className="font-semibold text-white">{income.name}</span>
            </p>
          </div>
        </div>

        {/* Monto sugerido — solapado */}
        <div className="flex justify-center -mt-6 mb-5 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 px-6 py-3 text-center">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Ahorro sugerido ({rule.percentage}%)</p>
            <p className="text-3xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
              {currencySymbol} {suggestedAmount.toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        {/* Detalle */}
        <div className="px-6 pb-2">
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Ingreso total</span>
              <span className="font-semibold font-mono text-slate-800">
                {currencySymbol} {income.amount.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Porcentaje</span>
              <span className="font-semibold text-slate-800">{rule.percentage}%</span>
            </div>
            <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center text-sm">
              <span className="text-slate-500">Destino</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {savingName}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-6 pt-4 space-y-2">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-3.5 text-base font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Sí, ahorrar {currencySymbol} {suggestedAmount.toLocaleString('es-AR')}
              </>
            )}
          </button>
          <button
            onClick={onDecline}
            disabled={loading}
            className="w-full py-3 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors disabled:opacity-50"
          >
            Omitir por ahora
          </button>
        </div>
      </div>
    </div>
  );
}
