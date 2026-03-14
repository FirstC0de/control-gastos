'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Saving, SavingType, Currency } from '@controlados/shared';

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#6366f1',
  '#14b8a6', '#f97316', '#84cc16', '#a855f7',
];

const TYPE_OPTIONS: { value: SavingType; label: string; desc: string }[] = [
  { value: 'account',    label: 'Cuenta bancaria',   desc: 'Caja de ahorro, plazo fijo, etc.' },
  { value: 'wallet',     label: 'Billetera virtual',  desc: 'Mercado Pago, Ualá, Brubank, etc.' },
  { value: 'cash',       label: 'Efectivo',           desc: 'Dinero en mano o caja propia' },
  { value: 'goal',       label: 'Meta de ahorro',     desc: 'Ahorro con objetivo y fecha' },
];

type Props = {
  onClose: () => void;
  saving?: Saving; // si viene → modo edición
};

export default function SavingModal({ onClose, saving }: Props) {
  const { addSaving, updateSaving } = useFinance();
  const isEdit = !!saving;

  const [name,        setName]        = useState(saving?.name        ?? '');
  const [type,        setType]        = useState<SavingType>(saving?.type ?? 'account');
  const [institution, setInstitution] = useState(saving?.institution  ?? '');
  const [currency,    setCurrency]    = useState<Currency>(saving?.currency ?? 'ARS');
  const [balance,     setBalance]     = useState(saving?.balance?.toString() ?? '');
  const [color,       setColor]       = useState(saving?.color       ?? PRESET_COLORS[0]);
  const [notes,       setNotes]       = useState(saving?.notes        ?? '');
  const [goalAmount,       setGoalAmount]       = useState(saving?.goalAmount?.toString() ?? '');
  const [goalDate,         setGoalDate]         = useState(saving?.goalDate     ?? '');
  const [monthlyContrib,   setMonthlyContrib]   = useState(saving?.monthlyContribution?.toString() ?? '');
  const [saving_,     setSaving_]     = useState(false);
  const [error,       setError]       = useState('');

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const showInstitution = type === 'account' || type === 'wallet';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const bal = parseFloat(balance.replace(',', '.'));
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    if (isNaN(bal) || bal < 0) { setError('El saldo debe ser un número válido'); return; }
    if (type === 'goal' && goalAmount) {
      const ga = parseFloat(goalAmount.replace(',', '.'));
      if (isNaN(ga) || ga <= 0) { setError('El monto objetivo debe ser mayor a 0'); return; }
    }

    setSaving_(true);
    try {
      const data: Omit<Saving, 'id'> = {
        name:        name.trim(),
        type,
        currency,
        balance:     bal,
        color,
        createdAt:   saving?.createdAt ?? new Date().toISOString().slice(0, 10),
        ...(institution.trim() && { institution: institution.trim() }),
        ...(notes.trim()       && { notes: notes.trim() }),
        ...(type === 'goal' && goalAmount && { goalAmount: parseFloat(goalAmount.replace(',', '.')) }),
        ...(type === 'goal' && goalDate   && { goalDate }),
        ...(type === 'goal' && monthlyContrib && { monthlyContribution: parseFloat(monthlyContrib.replace(',', '.')) }),
      };
      if (isEdit) {
        await updateSaving(saving.id, data);
      } else {
        await addSaving(data);
      }
      onClose();
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setSaving_(false);
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
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? 'Editar ahorro' : 'Nuevo ahorro'}
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
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      type === opt.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-semibold text-xs">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Ahorro Galicia, Caja dólares..."
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-300"
              />
            </div>

            {/* Institución (condicional) */}
            {showInstitution && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institución</label>
                <input
                  value={institution}
                  onChange={e => setInstitution(e.target.value)}
                  placeholder={type === 'wallet' ? 'Ej: Mercado Pago, Ualá...' : 'Ej: Banco Galicia, BBVA...'}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-300"
                />
              </div>
            )}

            {/* Moneda + Saldo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Moneda</label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                  {(['ARS', 'USD'] as Currency[]).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                        currency === c
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {type === 'goal' ? 'Monto actual' : 'Saldo actual'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balance}
                  onChange={e => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Meta de ahorro — campos adicionales */}
            {type === 'goal' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monto objetivo</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={goalAmount}
                      onChange={e => setGoalAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono placeholder:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha objetivo</label>
                    <input
                      type="date"
                      value={goalDate}
                      onChange={e => setGoalDate(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aporte mensual planeado <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={monthlyContrib}
                    onChange={e => setMonthlyContrib(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono placeholder:text-slate-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Se usa para estimar cuándo alcanzarás el objetivo</p>
                </div>
              </>
            )}

            {/* Color */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                      color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notas <span className="text-slate-400 font-normal">(opcional)</span></label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Descripción, condiciones, recordatorios..."
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none placeholder:text-slate-300"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving_}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving_ ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar ahorro'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
