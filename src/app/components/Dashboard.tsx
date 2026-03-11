'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import CardDashboardModal from './cards/CardDashboardModal';
import ExchangeRateBadge from './ui/ExchangeRateBadge';

type ViewMode = 'combinado' | 'separado';

export default function Dashboard() {
  const { expenses, incomes, getTotalExpenses, getTotalIncome, getBalance } = useFinance();
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
  const incomesARS      = incomes.filter(i => (i as any).currency !== 'USD');
  const incomesUSD      = incomes.filter(i => (i as any).currency === 'USD');
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ingresos</p>
              <p className="text-3xl font-bold text-emerald-600 tracking-tight">
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
            </div>

            {/* Gastos */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gastos</p>
              <p className="text-3xl font-bold text-rose-600 tracking-tight">
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
            </div>

            {/* Balance */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Balance</p>
              <p className={`text-3xl font-bold tracking-tight ${balanceCombinado >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                ${fmt(balanceCombinado)}
              </p>
              {blue > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  Dólar blue: ${fmt(blue)}
                </p>
              )}
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