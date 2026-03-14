'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Investment, InvestmentType, Currency } from '../../lib/types';

type Props = {
  onClose: () => void;
  investment?: Investment;
};

const TYPE_OPTIONS: { value: InvestmentType; label: string; desc: string }[] = [
  { value: 'stock',  label: 'Acciones',   desc: 'Acciones locales (BYMA)' },
  { value: 'cedear', label: 'CEDEARs',    desc: 'Certificados de depósito' },
  { value: 'bond',   label: 'Bonos',      desc: 'Soberanos o corporativos' },
  { value: 'crypto', label: 'Crypto',     desc: 'Bitcoin, ETH, USDT...' },
  { value: 'other',  label: 'Otro',       desc: 'FCI, oro, etc.' },
];

export default function InvestmentModal({ onClose, investment }: Props) {
  const { addInvestment, updateInvestment } = useFinance();
  const isEdit = !!investment;

  const [name,          setName]          = useState(investment?.name          ?? '');
  const [ticker,        setTicker]        = useState(investment?.ticker        ?? '');
  const [type,          setType]          = useState<InvestmentType>(investment?.type ?? 'stock');
  const [currency,      setCurrency]      = useState<Currency>(investment?.currency ?? 'ARS');
  const [quantity,      setQuantity]      = useState(investment?.quantity?.toString()      ?? '');
  const [purchasePrice, setPurchasePrice] = useState(investment?.purchasePrice?.toString() ?? '');
  const [currentPrice,  setCurrentPrice]  = useState(investment?.currentPrice?.toString()  ?? '');
  const [purchaseDate,  setPurchaseDate]  = useState(investment?.purchaseDate  ?? new Date().toISOString().slice(0, 10));
  const [notes,         setNotes]         = useState(investment?.notes         ?? '');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Preview
  const qty  = parseFloat(quantity)      || 0;
  const pp   = parseFloat(purchasePrice) || 0;
  const cp   = parseFloat(currentPrice)  || 0;
  const buyVal  = qty * pp;
  const curVal  = qty * cp;
  const gain    = curVal - buyVal;
  const gainPct = buyVal > 0 ? (gain / buyVal) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const qval  = parseFloat(quantity.replace(',', '.'));
    const ppval = parseFloat(purchasePrice.replace(',', '.'));
    const cpval = parseFloat(currentPrice.replace(',', '.'));
    if (!name.trim())             { setError('El nombre es obligatorio'); return; }
    if (isNaN(qval) || qval <= 0) { setError('La cantidad debe ser mayor a 0'); return; }
    if (isNaN(ppval) || ppval < 0){ setError('El precio de compra no es válido'); return; }
    if (isNaN(cpval) || cpval < 0){ setError('El precio actual no es válido'); return; }

    setLoading(true);
    try {
      const data: Omit<Investment, 'id'> = {
        name:          name.trim(),
        type,
        currency,
        quantity:      qval,
        purchasePrice: ppval,
        currentPrice:  cpval,
        purchaseDate,
        createdAt: investment?.createdAt ?? new Date().toISOString().slice(0, 10),
        ...(ticker.trim() && { ticker: ticker.trim().toUpperCase() }),
        ...(notes.trim()  && { notes: notes.trim() }),
      };
      if (isEdit) {
        await updateInvestment(investment.id, data);
      } else {
        await addInvestment(data);
      }
      onClose();
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <form
          onSubmit={handleSubmit}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? 'Editar inversión' : 'Nueva inversión'}
            </h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {/* Tipo */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Tipo</p>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setType(opt.value)}
                    className={`text-left px-2.5 py-2 rounded-xl border text-xs transition-all ${
                      type === opt.value
                        ? 'border-violet-500 bg-violet-50 text-violet-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    <p className="font-semibold">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre + Ticker */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ej: YPF, Bitcoin..."
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ticker <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input value={ticker} onChange={e => setTicker(e.target.value)}
                  placeholder="Ej: YPFD, BTC"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-300 uppercase" />
              </div>
            </div>

            {/* Moneda */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Moneda</label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden w-32">
                {(['ARS', 'USD'] as Currency[]).map(c => (
                  <button key={c} type="button" onClick={() => setCurrency(c)}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${currency === c ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad + Precios */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad</label>
                <input type="number" min="0" step="any" value={quantity} onChange={e => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono placeholder:text-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Precio compra</label>
                <input type="number" min="0" step="any" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono placeholder:text-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Precio actual</label>
                <input type="number" min="0" step="any" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono placeholder:text-slate-300" />
              </div>
            </div>

            {/* Fecha de compra */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de compra</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>

            {/* Preview */}
            {qty > 0 && pp > 0 && (
              <div className={`rounded-xl px-4 py-3 space-y-1.5 border ${gain >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${gain >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Proyección</p>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Valor de compra</span>
                  <span className="font-semibold font-mono text-slate-800">${buyVal.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
                {cp > 0 && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Valor actual</span>
                      <span className="font-semibold font-mono text-slate-800">${curVal.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-slate-200/60 pt-1.5">
                      <span className="text-slate-600 font-medium">Ganancia no realizada</span>
                      <span className={`font-bold font-mono ${gain >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {gain >= 0 ? '+' : ''}{gain.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ({gainPct.toFixed(1)}%)
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notas <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Broker, estrategia, etc."
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none placeholder:text-slate-300" />
            </div>

            {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar inversión'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
