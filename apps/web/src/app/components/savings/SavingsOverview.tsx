'use client';

import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import type { Saving, SavingType, SavingTransaction } from '@controlados/shared';
import SavingModal from './SavingModal';
import TransactionModal from './TransactionModal';
import SavingsGoals from './SavingsGoals';
import SavingsCharts from './SavingsCharts';

const TYPE_META: Record<SavingType, { label: string; color: string; bg: string; dot: string }> = {
  account: { label: 'Cuentas bancarias', color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500'    },
  wallet:  { label: 'Billeteras',        color: 'text-purple-700',  bg: 'bg-purple-50',  dot: 'bg-purple-500'  },
  cash:    { label: 'Efectivo',          color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  goal:    { label: 'Metas de ahorro',   color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500'   },
};

const fmt    = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SavingRow({
  s, onEdit, onDelete, onTransact,
}: {
  s: Saving;
  onEdit: () => void;
  onDelete: () => void;
  onTransact: () => void;
}) {
  const { blue } = useExchangeRate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isGoal = s.type === 'goal';
  const progress = isGoal && s.goalAmount && s.goalAmount > 0
    ? Math.min(100, (s.balance / s.goalAmount) * 100)
    : null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 group">
      {/* Color dot */}
      <div
        className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
        style={{ backgroundColor: s.color + '22', border: `2px solid ${s.color}40` }}
      >
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
          {s.institution && (
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">
              {s.institution}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{TYPE_META[s.type].label}</p>

        {isGoal && progress !== null && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>${fmt(s.balance)} / ${fmt(s.goalAmount!)}</span>
              <span className="font-semibold text-amber-600">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: s.color }}
              />
            </div>
            {s.goalDate && (
              <p className="text-[10px] text-slate-400 mt-1">
                Meta: {new Date(s.goalDate + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Monto + menú */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold font-mono text-slate-900">
          {s.currency === 'USD' ? 'U$D ' : '$'}{fmtDec(s.balance)}
        </p>
        {s.currency === 'USD' && blue && (
          <p className="text-[10px] text-slate-400 font-mono">≈ ${fmt(s.balance * blue)}</p>
        )}

        {/* Menú */}
        <div className="relative mt-1">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-36">
                <button
                  onClick={() => { setMenuOpen(false); onTransact(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Transacción
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onEdit(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ tx, onDelete }: { tx: SavingTransaction; onDelete: () => void }) {
  const isWithdrawal = tx.type === 'withdrawal';
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 group">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isWithdrawal ? 'bg-rose-50' : 'bg-emerald-50'}`}>
        <svg className={`w-3.5 h-3.5 ${isWithdrawal ? 'text-rose-500' : 'text-emerald-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {isWithdrawal
            ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          }
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">{tx.notes || (isWithdrawal ? 'Retiro' : tx.type === 'adjustment' ? 'Ajuste' : 'Depósito')}</p>
        <p className="text-[10px] text-slate-400">{new Date(tx.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold font-mono ${isWithdrawal ? 'text-rose-600' : 'text-emerald-600'}`}>
          {isWithdrawal ? '-' : '+'}${tx.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 ml-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

type Tab = 'resumen' | 'metas' | 'graficos';

export default function SavingsOverview() {
  const { savings, deleteSaving, getSavingsSummary, savingTransactions, deleteSavingTransaction } = useFinance();
  const { blue } = useExchangeRate();

  const [tab, setTab] = useState<Tab>('resumen');
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editSaving,     setEditSaving]     = useState<Saving | undefined>();
  const [confirmDel,     setConfirmDel]     = useState<string | null>(null);
  const [transactSaving, setTransactSaving] = useState<Saving | null>(null);
  const [showTxFor,      setShowTxFor]      = useState<string | null>(null);

  const summary = getSavingsSummary();
  const total   = summary.totalConverted;

  const types = (Object.keys(TYPE_META) as SavingType[]).filter(
    t => savings.some(s => s.type === t)
  );

  const handleDelete = async (id: string) => {
    await deleteSaving(id);
    setConfirmDel(null);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resumen',  label: 'Resumen'  },
    { id: 'metas',    label: 'Metas'    },
    { id: 'graficos', label: 'Gráficos' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ahorros</h1>
          <p className="text-sm text-slate-400 mt-0.5">Tus cuentas y metas de ahorro</p>
        </div>
        <button
          onClick={() => { setEditSaving(undefined); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </div>

      {savings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">Sin ahorros registrados</p>
          <p className="text-xs text-slate-400 mb-4">Agregá tus cuentas, efectivo y metas de ahorro para verlos todos en un lugar.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            Agregar primer ahorro
          </button>
        </div>
      ) : (
        <>
          {/* Resumen cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:col-span-1">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Total ahorrado</p>
              <p className="text-3xl font-bold text-emerald-600 font-mono tracking-tight">
                ${fmt(total)}
              </p>
              <p className="text-xs text-slate-400 mt-1">ARS · incl. conversión USD</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">En pesos</p>
              <p className="text-2xl font-bold text-slate-800 font-mono">${fmt(summary.totalARS)}</p>
              <p className="text-xs text-slate-400 mt-1">ARS</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">En dólares</p>
              <p className="text-2xl font-bold text-slate-800 font-mono">U$D {fmtDec(summary.totalUSD)}</p>
              {blue && <p className="text-xs text-slate-400 mt-1">≈ ${fmt(summary.totalUSD * blue)} ARS</p>}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  tab === t.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Resumen */}
          {tab === 'resumen' && (
            <div className="space-y-6">
              {/* Distribución por tipo */}
              {types.length > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Distribución</p>
                  <div className="space-y-3">
                    {types.map(t => {
                      const val  = summary.byType[t] ?? 0;
                      const pct  = total > 0 ? (val / total) * 100 : 0;
                      const meta = TYPE_META[t];
                      return (
                        <div key={t} className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                          <span className="text-xs text-slate-600 w-36 shrink-0">{meta.label}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${meta.dot} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold font-mono text-slate-700 w-24 text-right shrink-0">
                            ${fmt(val)}
                          </span>
                          <span className="text-xs text-slate-400 w-10 text-right shrink-0">{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lista de cuentas */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Mis cuentas</p>
                <div>
                  {savings.map(s => (
                    <div key={s.id}>
                      <SavingRow
                        s={s}
                        onEdit={() => { setEditSaving(s); setModalOpen(true); }}
                        onDelete={() => setConfirmDel(s.id)}
                        onTransact={() => setTransactSaving(s)}
                      />
                      {/* Mostrar historial de transacciones expandido */}
                      {showTxFor === s.id && (
                        <div className="ml-12 mb-2 bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Historial</p>
                          {savingTransactions.filter(tx => tx.savingId === s.id).length === 0 ? (
                            <p className="text-xs text-slate-400">Sin transacciones</p>
                          ) : (
                            savingTransactions
                              .filter(tx => tx.savingId === s.id)
                              .slice(0, 10)
                              .map(tx => (
                                <TransactionRow
                                  key={tx.id}
                                  tx={tx}
                                  onDelete={() => deleteSavingTransaction(tx.id)}
                                />
                              ))
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => setShowTxFor(v => v === s.id ? null : s.id)}
                        className="ml-12 text-[10px] text-slate-400 hover:text-slate-600 transition-colors mb-1"
                      >
                        {showTxFor === s.id ? '▲ Ocultar historial' : '▼ Ver historial'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Metas */}
          {tab === 'metas' && <SavingsGoals />}

          {/* Tab: Gráficos */}
          {tab === 'graficos' && <SavingsCharts />}
        </>
      )}

      {/* Modal agregar/editar */}
      {modalOpen && (
        <SavingModal
          onClose={() => { setModalOpen(false); setEditSaving(undefined); }}
          saving={editSaving}
        />
      )}

      {/* Modal transacción */}
      {transactSaving && (
        <TransactionModal
          saving={transactSaving}
          onClose={() => setTransactSaving(null)}
        />
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setConfirmDel(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto">
              <p className="text-sm font-bold text-slate-900 mb-2">¿Eliminar este ahorro?</p>
              <p className="text-xs text-slate-500 mb-5">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={() => handleDelete(confirmDel)} className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
