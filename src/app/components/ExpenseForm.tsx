'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import CategorySelector from './categories/CategorySelector';
import { Currency } from '../lib/types';

export default function ExpenseForm() {
  const { addExpense, cards, selectedMonth } = useFinance();
  const [formData, setFormData] = useState({
    description:  '',
    amount:       0,
    date:         new Date().toISOString().split('T')[0],
    categoryId:   null as string | null,
    cardId:       null as string | null,
    installments: 1,
    currency:     'ARS' as Currency,
    recurring:    false,
    recurringDay: 1 as number | undefined,
  });

  // Reset date when month changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`,
    }));
  }, [selectedMonth]);
  const [loading, setLoading] = useState(false);

  const installmentAmount = formData.installments > 1
    ? formData.amount / formData.installments
    : formData.amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.amount <= 0) return;
    setLoading(true);
    try {
      const monthYear = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
      await addExpense({
        description:        formData.description,
        amount:             formData.amount,
        date:               formData.date,
        categoryId:         formData.categoryId ?? undefined,
        cardId:             formData.cardId ?? undefined,
        installments:       formData.recurring ? 1 : formData.installments,
        currentInstallment: 1,
        installmentAmount:  parseFloat(installmentAmount.toFixed(2)),
        currency:           formData.currency,
        recurring:          formData.recurring || undefined,
        recurringDay:       formData.recurring ? formData.recurringDay : undefined,
        monthYear,
      });
      setFormData({
        description: '', amount: 0,
        date: `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`,
        categoryId: null, cardId: null, installments: 1,
        currency: 'ARS', recurring: false, recurringDay: 1,
      });
    } catch (error) {
      console.error('Error al guardar el gasto:', error);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow";
  const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-900">Nuevo gasto</h2>
        {formData.installments > 1 && formData.amount > 0 && (
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {formData.installments} cuotas de {formData.currency === 'USD' ? 'U$D' : '$'}{installmentAmount.toFixed(2)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Descripción */}
        <div className="lg:col-span-1">
          <label className={labelClass}>Descripción *</label>
          <input type="text" value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className={inputClass} placeholder="¿En qué gastaste?" required />
        </div>

        {/* Monto + Moneda juntos */}
        <div>
          <label className={labelClass}>Monto total *</label>
          <div className="flex gap-2">
            <select value={formData.currency}
              onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}
              className="px-2 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0">
              <option value="ARS">$</option>
              <option value="USD">U$D</option>
            </select>
            <input type="number" value={formData.amount || ''}
              onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className={inputClass} step="0.01" min="0" placeholder="0.00" required />
          </div>
        </div>

        {/* Cuotas */}
        {!formData.recurring && (
          <div>
            <label className={labelClass}>Cuotas</label>
            <select value={formData.installments}
              onChange={e => setFormData({ ...formData, installments: Number(e.target.value) })}
              className={inputClass}>
              <option value={1}>Contado</option>
              {[2, 3, 6, 9, 12, 18, 24].map(n => (
                <option key={n} value={n}>{n} cuotas</option>
              ))}
            </select>
          </div>
        )}

        {/* Fecha */}
        <div>
          <label className={labelClass}>Fecha *</label>
          <input type="date" value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            className={inputClass} required />
        </div>

        {/* Tarjeta */}
        <div>
          <label className={labelClass}>Tarjeta</label>
          <select value={formData.cardId || ''}
            onChange={e => setFormData({ ...formData, cardId: e.target.value || null })}
            className={inputClass}>
            <option value="">Sin tarjeta / Efectivo</option>
            {cards.map(card => (
              <option key={card.id} value={card.id}>{card.name}</option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label className={labelClass}>Categoría</label>
          <CategorySelector value={formData.categoryId}
            onChange={id => setFormData({ ...formData, categoryId: id })}
            categoryType="expense" className={inputClass} />
        </div>

        {/* Recurrente */}
        <div className="sm:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.recurring}
                onChange={e => setFormData({ ...formData, recurring: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-sm font-medium text-slate-700">Gasto recurrente (mensual)</span>
            </label>
            {formData.recurring && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Día del mes:</label>
                <input
                  type="number" min={1} max={28}
                  value={formData.recurringDay ?? 1}
                  onChange={e => setFormData({ ...formData, recurringDay: Math.min(28, Math.max(1, Number(e.target.value))) })}
                  className="w-16 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-400">de cada mes</span>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={loading}
          className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors">
          {loading ? 'Guardando...' : '+ Agregar gasto'}
        </button>
      </div>
    </form>
  );
}
