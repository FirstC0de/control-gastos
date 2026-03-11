'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import CardDashboardModal from './cards/CardDashboardModal';
import ExchangeRateBadge from './ui/ExchangeRateBadge';

type ViewMode = 'combinado' | 'separado';

export default function Dashboard() {
  const { expenses, incomes } = useFinance();
  const { blue } = useExchangeRate();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode]   = useState<ViewMode>('combinado');

  // ── Gastos ────────────────────────────────────────────
  const expensesARS     = expenses.filter(e => e.currency !== 'USD');
  const expensesUSD     = expenses.filter(e => e.currency === 'USD');
  const totalARS_exp    = expensesARS.reduce((s, e) => s + e.amount, 0);
  const totalUSD_exp    = expensesUSD.reduce((s, e) => s + e.amount, 0);
  const totalUSD_exp_conv = totalUSD_exp * (blue || 0);
  const totalCombinado_exp = totalARS_exp + totalUSD_exp_conv;

  // ── Ingresos ──────────────────────────────────────────
  const incomesARS      = incomes.filter(i => i.currency !== 'USD');
  const incomesUSD      = incomes.filter(i => i.currency === 'USD');
  const totalARS_inc    = incomesARS.reduce((s, i) => s + i.amount, 0);
  const totalUSD_inc    = incomesUSD.reduce((s, i) => s + i.amount, 0);
  const totalUSD_inc_conv = totalUSD_inc * (blue || 0);
  const totalCombinado_inc = totalARS_inc + totalUSD_inc_conv;

  // ── Balance ───────────────────────────────────────────
  const balanceCombinado = totalCombinado_inc - totalCombinado_exp;
  const balanceARS       = totalARS_inc - totalARS_exp;
  const balanceUSD       = totalUSD_inc - totalUSD_exp;

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const fmtUSD = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  return (
    <>
      <div className="mb-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Resumen financiero del mes</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ExchangeRateBadge />
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
            >
              💳 Tarjetas
            </button>
          </div>
        </div>

        {/* Toggle de vista */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-5">
          <button
            onClick={() => setViewMode('combinado')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'combinado'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Todo en ARS
          </button>
          <button
            onClick={() => setViewMode('separado')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'separado'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ARS + USD por separado
          </button>
        </div>

        {/* ── VISTA COMBINADA ── */}
        {viewMode === 'combinado' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Ingresos */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingresos</p>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
                ${fmt(totalCombinado_inc)}
              </p>
              {totalUSD_inc > 0 && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-slate-400">${fmt(totalARS_inc)} ARS</p>
                  <p className="text-xs text-slate-400">
                    + U$D {fmtUSD(totalUSD_inc)} × ${fmt(blue)} = ${fmt(totalUSD_inc_conv)}
                  </p>
                </div>
              )}
              <div className="mt-3 h-1 rounded-full bg-emerald-100">
                <div className="h-1 rounded-full bg-emerald-500" style={{ width: totalCombinado_inc > 0 ? '100%' : '0%' }} />
              </div>
            </div>

            {/* Gastos */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos</p>
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
                ${fmt(totalCombinado_exp)}
              </p>
              {totalUSD_exp > 0 && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-slate-400">${fmt(totalARS_exp)} ARS</p>
                  <p className="text-xs text-slate-400">
                    + U$D {fmtUSD(totalUSD_exp)} × ${fmt(blue)} = ${fmt(totalUSD_exp_conv)}
                  </p>
                </div>
              )}
              <div className="mt-3 h-1 rounded-full bg-rose-100">
                <div className="h-1 rounded-full bg-rose-500"
                  style={{ width: totalCombinado_inc > 0 ? `${Math.min(100, (totalCombinado_exp / totalCombinado_inc) * 100)}%` : '0%' }} />
              </div>
            </div>

            {/* Balance */}
            <div className={`rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow group ${
              balanceCombinado >= 0
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500'
                : 'bg-gradient-to-br from-rose-600 to-rose-700 border-rose-500'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Balance</p>
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-white tracking-tight font-mono">
                ${fmt(balanceCombinado)}
              </p>
              {blue > 0 && (
                <p className="text-xs text-white/60 mt-2">
                  Blue: ${fmt(blue)}
                </p>
              )}
              <div className="mt-3 h-1 rounded-full bg-white/20">
                <div className="h-1 rounded-full bg-white/60" style={{ width: balanceCombinado >= 0 ? '100%' : '30%' }} />
              </div>
            </div>
          </div>
        )}

        {/* ── VISTA SEPARADA ── */}
        {viewMode === 'separado' && (
          <div className="space-y-4">

            {/* Fila ARS */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pesos argentinos</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-medium text-slate-400 mb-1">Ingresos ARS</p>
                  <p className="text-2xl font-bold text-emerald-600">${fmt(totalARS_inc)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-medium text-slate-400 mb-1">Gastos ARS</p>
                  <p className="text-2xl font-bold text-rose-600">${fmt(totalARS_exp)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-medium text-slate-400 mb-1">Balance ARS</p>
                  <p className={`text-2xl font-bold ${balanceARS >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    ${fmt(balanceARS)}
                  </p>
                </div>
              </div>
            </div>

            {/* Fila USD */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dólares</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-emerald-200 p-5">
                  <p className="text-xs font-medium text-slate-400 mb-1">Ingresos USD</p>
                  <p className="text-2xl font-bold text-emerald-600">U$D {fmtUSD(totalUSD_inc)}</p>
                  {blue > 0 && totalUSD_inc > 0 && (
                    <p className="text-xs text-slate-400 mt-1">≈ ${fmt(totalUSD_inc_conv)} ARS</p>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-rose-200 p-5">
                  <p className="text-xs font-medium text-slate-400 mb-1">Gastos USD</p>
                  <p className="text-2xl font-bold text-rose-600">U$D {fmtUSD(totalUSD_exp)}</p>
                  {blue > 0 && totalUSD_exp > 0 && (
                    <p className="text-xs text-slate-400 mt-1">≈ ${fmt(totalUSD_exp_conv)} ARS</p>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-medium text-slate-400 mb-1">Balance USD</p>
                  <p className={`text-2xl font-bold ${balanceUSD >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    U$D {fmtUSD(balanceUSD)}
                  </p>
                  {blue > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      ≈ ${fmt(balanceUSD * blue)} ARS
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Balance total combinado al pie */}
            <div className="bg-slate-900 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Balance total (ARS + USD convertido)
                </p>
                <p className={`text-3xl font-bold ${balanceCombinado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${fmt(balanceCombinado)}
                </p>
              </div>
              {blue > 0 && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Dólar blue usado</p>
                  <p className="text-sm font-semibold text-slate-300">${fmt(blue)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CardDashboardModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}