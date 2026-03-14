'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Saving, SavingTransactionType } from '../../lib/types';

type Props = {
  saving: Saving;
  onClose: () => void;
};

const TYPE_OPTIONS: { value: SavingTransactionType; label: string; color: string }[] = [
  { value: 'deposit',    label: 'Depósito',   color: 'emerald' },
  { value: 'withdrawal', label: 'Retiro',     color: 'rose'    },
  { value: 'adjustment', label: 'Ajuste',     color: 'blue'    },
];

export default function TransactionModal({ saving, onClose }: Props) {
  const { addSavingTransaction } = useFinance();

  const [type,    setType]    = useState<SavingTransactionType>('deposit');
  const [amount,  setAmount]  = useState('');
  const [date,    setDate]    = useState(new Date().toISOString().slice(0, 10));
  const [notes,   setNotes]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) { setError('El monto debe ser mayor a 0'); return; }
    if (type === 'withdrawal' && amt > saving.balance) {
      setError('El retiro supera el saldo disponible');
      return;
    }
    setLoading(true);
    try {
      await addSavingTransaction({
        savingId: saving.id,
        type,
        amount: amt,
        date,
        ...(notes.trim() && { notes: notes.trim() }),
      });
      onClose();
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <form
          onSubmit={handleSubmit}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Nueva transacción</h2>
              <p className="text-xs text-slate-400 mt-0.5">{saving.name}</p>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Saldo actual */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-500">Saldo actual</span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {saving.currency === 'USD' ? 'U$D ' : '$'}{fmt(saving.balance)}
              </span>
            </div>

            {/* Tipo */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Tipo</p>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                      type === opt.value
                        ? opt.color === 'emerald' ? 'bg-emerald-500 text-white border-emerald-500'
                          : opt.color === 'rose'    ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-blue-500 text-white border-blue-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monto</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono placeholder:text-slate-300"
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notas <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej: Sueldo de enero..."
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-300"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
