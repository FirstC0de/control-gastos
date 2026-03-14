'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { FixedTerm, Currency } from '@controlados/shared';

type Props = {
  onClose: () => void;
  fixedTerm?: FixedTerm;
};

const fmtNum = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FixedTermModal({ onClose, fixedTerm }: Props) {
  const { addFixedTerm, updateFixedTerm } = useFinance();
  const isEdit = !!fixedTerm;

  const today = new Date().toISOString().slice(0, 10);
  const in30  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const [institution, setInstitution] = useState(fixedTerm?.institution ?? '');
  const [principal,   setPrincipal]   = useState(fixedTerm?.principal?.toString() ?? '');
  const [currency,    setCurrency]    = useState<Currency>(fixedTerm?.currency ?? 'ARS');
  const [startDate,   setStartDate]   = useState(fixedTerm?.startDate ?? today);
  const [endDate,     setEndDate]     = useState(fixedTerm?.endDate ?? in30);
  const [rate,        setRate]        = useState(fixedTerm?.rate?.toString() ?? '');
  const [renew,       setRenew]       = useState(fixedTerm?.renewOnExpiry ?? false);
  const [notes,       setNotes]       = useState(fixedTerm?.notes ?? '');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Preview calculations
  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  const start = new Date(startDate + 'T12:00:00');
  const end   = new Date(endDate   + 'T12:00:00');
  const daysTotal   = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
  const projInterest = p * (r / 100 / 365) * daysTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const pval = parseFloat(principal.replace(',', '.'));
    const rval = parseFloat(rate.replace(',', '.'));
    if (!institution.trim()) { setError('La institución es obligatoria'); return; }
    if (isNaN(pval) || pval <= 0) { setError('El monto debe ser mayor a 0'); return; }
    if (isNaN(rval) || rval <= 0) { setError('La tasa debe ser mayor a 0'); return; }
    if (endDate <= startDate)     { setError('La fecha de fin debe ser posterior a la de inicio'); return; }

    setLoading(true);
    try {
      const data: Omit<FixedTerm, 'id'> = {
        institution: institution.trim(),
        principal: pval,
        currency,
        startDate,
        endDate,
        rate: rval,
        renewOnExpiry: renew,
        createdAt: fixedTerm?.createdAt ?? new Date().toISOString().slice(0, 10),
        ...(notes.trim() && { notes: notes.trim() }),
      };
      if (isEdit) {
        await updateFixedTerm(fixedTerm.id, data);
      } else {
        await addFixedTerm(data);
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
              {isEdit ? 'Editar plazo fijo' : 'Nuevo plazo fijo'}
            </h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {/* Institución */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institución</label>
              <input
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                placeholder="Ej: Banco Galicia, Brubank, Naranja X..."
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
              />
            </div>

            {/* Moneda + Monto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Moneda</label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                  {(['ARS', 'USD'] as Currency[]).map(c => (
                    <button key={c} type="button" onClick={() => setCurrency(c)}
                      className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${currency === c ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Capital</label>
                <input
                  type="number" min="0" step="0.01"
                  value={principal}
                  onChange={e => setPrincipal(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha inicio</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha fin</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* TNA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">TNA (%)</label>
              <input
                type="number" min="0" step="0.01"
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder="Ej: 118.5"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono placeholder:text-slate-300"
              />
            </div>

            {/* Preview */}
            {p > 0 && r > 0 && daysTotal > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Proyección</p>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Plazo</span>
                  <span className="font-semibold text-slate-800">{daysTotal} días</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Interés estimado</span>
                  <span className="font-semibold text-emerald-700 font-mono">+ ${fmtNum(projInterest)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-blue-100 pt-1.5 mt-1">
                  <span className="text-slate-600 font-medium">Total al vencimiento</span>
                  <span className="font-bold text-slate-900 font-mono">${fmtNum(p + projInterest)}</span>
                </div>
              </div>
            )}

            {/* Renovar */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRenew(v => !v)}
                className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${renew ? 'bg-blue-600' : 'bg-slate-200'}`}
                style={{ height: '22px' }}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${renew ? 'translate-x-4.5' : ''}`}
                  style={{ width: '18px', height: '18px', transform: renew ? 'translateX(18px)' : 'none' }}
                />
              </button>
              <div>
                <p className="text-xs font-semibold text-slate-700">Renovación automática</p>
                <p className="text-[10px] text-slate-400">Renovar por el mismo plazo al vencer</p>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notas <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Condiciones, número de cuenta, etc."
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-300"
              />
            </div>

            {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar plazo fijo'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
