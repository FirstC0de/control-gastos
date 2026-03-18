'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { AutoSavingRule } from '@controlados/shared';
import NumericInput from './ui/NumericInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingRule?: AutoSavingRule | null;
}

const inputClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow";
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

const PERCENTAGE_PRESETS = [5, 10, 15, 20, 25, 30];

export default function AutoSavingRuleModal({ isOpen, onClose, editingRule }: Props) {
  const { getCategoriesByType, savings, createAutoSavingRule, updateAutoSavingRule } = useFinance();

  const incomeCategories = getCategoriesByType('income');
  const arsAccounts = savings.filter(s => s.currency === 'ARS');

  const [categoryId, setCategoryId] = useState('');
  const [percentage, setPercentage] = useState(20);
  const [targetSavingId, setTargetSavingId] = useState('');
  const [askEveryTime, setAskEveryTime] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingRule) {
      setCategoryId(editingRule.categoryId);
      setPercentage(editingRule.percentage);
      setTargetSavingId(editingRule.targetSavingId);
      setAskEveryTime(editingRule.askEveryTime);
    } else {
      setCategoryId('');
      setPercentage(20);
      setTargetSavingId(arsAccounts[0]?.id ?? '');
      setAskEveryTime(true);
    }
    setError('');
  }, [editingRule, isOpen]); // eslint-disable-line

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!categoryId) { setError('Seleccioná una categoría'); return; }
    if (!targetSavingId) { setError('Seleccioná una cuenta de ahorro'); return; }
    if (percentage < 1 || percentage > 100) { setError('El porcentaje debe estar entre 1 y 100'); return; }

    setLoading(true);
    try {
      const cat = incomeCategories.find(c => c.id === categoryId);
      const saving = savings.find(s => s.id === targetSavingId);

      if (editingRule) {
        await updateAutoSavingRule(editingRule.id, {
          categoryId,
          categoryName: cat?.name,
          percentage,
          targetSavingId,
          targetSavingName: saving?.name,
          askEveryTime,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await createAutoSavingRule({
          categoryId,
          categoryName: cat?.name,
          percentage,
          targetSavingId,
          targetSavingName: saving?.name,
          isActive: true,
          askEveryTime,
          createdAt: new Date().toISOString(),
          totalSaved: 0,
        });
      }
      onClose();
    } catch {
      setError('Error al guardar la regla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {editingRule ? 'Editar regla' : 'Nueva regla de ahorro'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Categoría */}
          <div>
            <label className={labelClass}>Categoría de ingreso</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">Seleccioná una categoría...</option>
              {incomeCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">La regla se activará cuando agregues un ingreso con esta categoría</p>
          </div>

          {/* Porcentaje */}
          <div>
            <label className={labelClass}>Porcentaje a ahorrar</label>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2">
                <NumericInput
                  value={percentage}
                  onChange={val => setPercentage(Math.min(100, Math.max(1, Math.round(val) || 1)))}
                  variant="integer"
                  min={1}
                  max={100}
                  stepper
                  stepAmount={5}
                  className="w-20 text-sm border-slate-300"
                />
                <span className="text-sm text-slate-500 font-medium">%</span>
              </div>
              <div className="flex gap-1 ml-auto flex-wrap justify-end">
                {PERCENTAGE_PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPercentage(p)}
                    className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                      percentage === p
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Destino */}
          <div>
            <label className={labelClass}>Cuenta destino</label>
            {savings.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                No tenés cuentas de ahorro. Creá una primero en la sección Ahorros.
              </p>
            ) : (
              <select
                value={targetSavingId}
                onChange={e => setTargetSavingId(e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccioná una cuenta...</option>
                {savings.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.currency})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Comportamiento */}
          <div>
            <label className={labelClass}>Comportamiento</label>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                askEveryTime ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="behavior"
                  checked={askEveryTime}
                  onChange={() => setAskEveryTime(true)}
                  className="mt-0.5 accent-indigo-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Preguntar cada vez</p>
                  <p className="text-xs text-slate-500 mt-0.5">Aparece una sugerencia con opción de aceptar o rechazar</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                !askEveryTime ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="behavior"
                  checked={!askEveryTime}
                  onChange={() => setAskEveryTime(false)}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Automático (sin preguntar)</p>
                  <p className="text-xs text-slate-500 mt-0.5">El ahorro se aplica al instante con opción de deshacer</p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2 border border-rose-100">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || savings.length === 0}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : editingRule ? 'Actualizar regla' : 'Crear regla'}
          </button>
        </div>
      </div>
    </div>
  );
}
