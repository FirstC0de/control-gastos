'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFinance } from '../../context/FinanceContext';

export default function BudgetAlertBanner() {
  const { getBudgetStatus } = useFinance();
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const statuses = getBudgetStatus();
  const exceeded = statuses.filter(s => s.status === 'exceeded');
  const warnings  = statuses.filter(s => s.status === 'warning');

  if (dismissed || (exceeded.length === 0 && warnings.length === 0)) return null;

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 0 });

  return (
    <>
      {/* Banner */}
      <div className={`rounded-2xl border px-5 py-4 flex items-start gap-3 mb-5 ${
        exceeded.length > 0
          ? 'bg-rose-50 border-rose-200 text-rose-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <div className="shrink-0 mt-0.5">
          {exceeded.length > 0 ? (
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {exceeded.length > 0 && (
            <p className="text-sm font-semibold">
              {exceeded.length === 1
                ? `"${exceeded[0].budget.name}" superó su presupuesto`
                : `${exceeded.length} presupuestos superados este mes`}
            </p>
          )}
          {warnings.length > 0 && (
            <p className={`text-sm ${exceeded.length > 0 ? 'font-normal mt-0.5' : 'font-semibold'}`}>
              {warnings.length === 1
                ? `"${warnings[0].budget.name}" llegó al ${warnings[0].percentageUsed.toFixed(0)}%`
                : `${warnings.length} presupuestos cerca del límite`}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <button
              onClick={() => setModalOpen(true)}
              className={`text-xs font-semibold underline underline-offset-2 ${
                exceeded.length > 0 ? 'text-rose-700 hover:text-rose-900' : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              Ver detalle
            </button>
            <Link
              href="/ingresos?tab=budgets"
              className={`text-xs font-medium ${
                exceeded.length > 0 ? 'text-rose-600 hover:text-rose-800' : 'text-amber-600 hover:text-amber-800'
              }`}
            >
              Gestionar presupuestos →
            </Link>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className={`shrink-0 p-1 rounded-lg transition-colors ${
            exceeded.length > 0 ? 'hover:bg-rose-100 text-rose-400' : 'hover:bg-amber-100 text-amber-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Detail Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Estado de presupuestos</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-3">
              {[...exceeded, ...warnings].map(s => (
                <div
                  key={s.budget.id}
                  className={`rounded-xl border p-4 ${
                    s.status === 'exceeded'
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{s.budget.name}</p>
                      {s.categoryName && (
                        <p className="text-xs text-slate-500 mt-0.5">{s.categoryName}</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      s.status === 'exceeded'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {s.percentageUsed.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full ${s.status === 'exceeded' ? 'bg-rose-500' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(100, s.percentageUsed)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600">Gastado: <strong>${fmt(s.spentAmount)}</strong></span>
                    <span className="text-slate-500">Límite: ${fmt(s.budgetAmount)}</span>
                  </div>
                  {s.status === 'exceeded' && (
                    <p className="text-xs font-semibold text-rose-600 mt-1">
                      Excedido por ${fmt(Math.abs(s.remaining))}
                    </p>
                  )}
                  {s.status === 'warning' && (
                    <p className="text-xs font-semibold text-amber-600 mt-1">
                      Disponible: ${fmt(s.remaining)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 pb-5">
              <Link
                href="/ingresos?tab=budgets"
                onClick={() => setModalOpen(false)}
                className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                Gestionar presupuestos
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
