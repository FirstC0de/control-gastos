'use client';

import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import type { Investment, InvestmentType } from '../../lib/types';
import InvestmentModal from './InvestmentModal';

const TYPE_META: Record<InvestmentType, { label: string; color: string; bg: string }> = {
  stock:  { label: 'Acciones',  color: 'text-blue-700',   bg: 'bg-blue-50'   },
  cedear: { label: 'CEDEARs',   color: 'text-indigo-700', bg: 'bg-indigo-50' },
  bond:   { label: 'Bonos',     color: 'text-amber-700',  bg: 'bg-amber-50'  },
  crypto: { label: 'Crypto',    color: 'text-orange-700', bg: 'bg-orange-50' },
  other:  { label: 'Otro',      color: 'text-slate-600',  bg: 'bg-slate-100' },
};

export default function InvestmentList() {
  const { getInvestmentStatus, deleteInvestment, updateInvestment } = useFinance();
  const { blue } = useExchangeRate();

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editInv,      setEditInv]      = useState<Investment | undefined>();
  const [confirmDel,   setConfirmDel]   = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput,   setPriceInput]   = useState('');

  const statuses = getInvestmentStatus();
  const toARS = (v: number, currency: string) => currency === 'USD' ? v * (blue || 1) : v;

  const totalCost    = statuses.reduce((s, x) => s + toARS(x.purchaseValue, x.investment.currency), 0);
  const totalCurrent = statuses.reduce((s, x) => s + toARS(x.currentValue,  x.investment.currency), 0);
  const totalGain    = totalCurrent - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Group by type
  const byType = (Object.keys(TYPE_META) as InvestmentType[])
    .map(t => ({ type: t, items: statuses.filter(s => s.investment.type === t) }))
    .filter(g => g.items.length > 0);

  const handlePriceUpdate = async (id: string) => {
    const val = parseFloat(priceInput.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      await updateInvestment(id, { currentPrice: val });
    }
    setEditingPrice(null);
    setPriceInput('');
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      {statuses.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Invertido</p>
            <p className="text-lg font-bold font-mono text-slate-800">${totalCost.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Valor actual</p>
            <p className="text-lg font-bold font-mono text-slate-800">${totalCurrent.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className={`rounded-xl border p-4 ${totalGain >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Ganancia</p>
            <p className={`text-lg font-bold font-mono ${totalGain >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </p>
            <p className={`text-[10px] font-semibold ${totalGain >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{totalGainPct.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">{statuses.length} posición{statuses.length !== 1 ? 'es' : ''}</p>
        <button
          onClick={() => { setEditInv(undefined); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </div>

      {statuses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-10 text-center">
          <p className="text-sm font-semibold text-slate-700 mb-1">Sin inversiones</p>
          <p className="text-xs text-slate-400">Registrá acciones, CEDEARs, bonos y crypto para ver tu plusvalía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byType.map(({ type, items }) => {
            const meta = TYPE_META[type];
            return (
              <div key={type} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className={`px-5 py-3 border-b border-slate-100 flex items-center gap-2 ${meta.bg}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                  <span className="text-xs text-slate-400">({items.length})</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map(({ investment: inv, purchaseValue, currentValue, unrealizedGain, unrealizedGainPct }) => {
                    const cvARS = toARS(currentValue, inv.currency);
                    return (
                      <div key={inv.id} className="px-5 py-3.5 flex items-center gap-3 group hover:bg-slate-50/60 transition-colors">
                        {/* Name + ticker */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 truncate">{inv.name}</p>
                            {inv.ticker && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                                {inv.ticker}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {inv.quantity} u. · Compra: ${inv.purchasePrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </p>
                        </div>

                        {/* Precio actual (editable) */}
                        <div className="text-center shrink-0 w-28">
                          {editingPrice === inv.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={priceInput}
                                onChange={e => setPriceInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handlePriceUpdate(inv.id); if (e.key === 'Escape') setEditingPrice(null); }}
                                autoFocus
                                className="w-20 text-xs border border-violet-300 rounded-lg px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500"
                              />
                              <button onClick={() => handlePriceUpdate(inv.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingPrice(inv.id); setPriceInput(inv.currentPrice.toString()); }}
                              className="text-xs font-mono text-slate-700 hover:text-violet-600 transition-colors group/price flex items-center gap-1"
                              title="Actualizar precio"
                            >
                              ${inv.currentPrice.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                              <svg className="w-3 h-3 opacity-0 group-hover/price:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}
                          <p className="text-[10px] text-slate-400">precio actual</p>
                        </div>

                        {/* Valor + ganancia */}
                        <div className="text-right shrink-0 w-28">
                          <p className="text-sm font-bold font-mono text-slate-900">${cvARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                          <p className={`text-xs font-semibold font-mono ${unrealizedGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {unrealizedGain >= 0 ? '+' : ''}{unrealizedGainPct.toFixed(1)}%
                          </p>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => { setEditInv(inv); setModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button onClick={() => setConfirmDel(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <InvestmentModal
          onClose={() => { setModalOpen(false); setEditInv(undefined); }}
          investment={editInv}
        />
      )}

      {confirmDel && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setConfirmDel(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto">
              <p className="text-sm font-bold text-slate-900 mb-2">¿Eliminar esta inversión?</p>
              <p className="text-xs text-slate-500 mb-5">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={async () => { await deleteInvestment(confirmDel); setConfirmDel(null); }}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors">Eliminar</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
