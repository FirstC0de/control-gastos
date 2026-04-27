'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import CategorySelector from './categories/CategorySelector';
import CategoriesModal from './categories/CategoriesModal';
import RecurringToggle from './ui/RecurringToggle';
import { Currency } from '@controlados/shared';
import NumericInput from './ui/NumericInput';

const TagIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

interface Props {
  onOpenImport?: () => void;
  onOpenCards?: () => void;
}

/** Calcula el mes de cobro (vencimiento) en base al día de cierre de la tarjeta.
 *  Antes del cierre → entra al resumen actual → se cobra el mes siguiente.
 *  Después del cierre → entra al resumen siguiente → se cobra en 2 meses. */
function getCardBillingMonthYear(expenseDateStr: string, closingDay: number): string {
  const [year, month, day] = expenseDateStr.split('-').map(Number);
  if (day >= closingDay) {
    // Pasó el cierre: entra al resumen del mes siguiente → vence en mes+2
    const next = new Date(year, month + 1, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
  }
  // Antes del cierre: entra al resumen de este mes → vence el mes siguiente
  const next = new Date(year, month, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function ExpenseForm({ onOpenImport, onOpenCards }: Props) {
  const { addExpense, cards, selectedMonth } = useFinance();
  const [showCatModal, setShowCatModal] = useState(false);
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
    const today = new Date();
    const isCurrentMonth = selectedMonth.year === today.getFullYear() && selectedMonth.month === today.getMonth();
    const newDate = isCurrentMonth
      ? today.toISOString().split('T')[0]
      : `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`;
    setFormData(prev => ({ ...prev, date: newDate }));
  }, [selectedMonth]);
  const [loading, setLoading] = useState(false);

  const installmentAmount = formData.installments > 1
    ? formData.amount / formData.installments
    : formData.amount;

  // Si hay tarjeta seleccionada, calculamos en qué mes cae el gasto según el cierre
  const selectedCard = cards.find(c => c.id === formData.cardId);
  const billingMonthYear = (() => {
    if (selectedCard && !formData.recurring) {
      return getCardBillingMonthYear(formData.date, selectedCard.closingDay);
    }
    return `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.amount <= 0) return;
    setLoading(true);
    try {
      const monthYear = billingMonthYear;
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
      const today = new Date();
      const isCurrentMonth = selectedMonth.year === today.getFullYear() && selectedMonth.month === today.getMonth();
      const resetDate = isCurrentMonth
        ? today.toISOString().split('T')[0]
        : `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`;
      setFormData({
        description: '', amount: 0,
        date: resetDate,
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
      <div className="flex items-center justify-between gap-2 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl bg-linear-to-r from-indigo-50 to-slate-50 border-b border-indigo-100">
        <h2 className="text-lg font-bold text-indigo-900 tracking-tight">Nuevo gasto</h2>
        <div className="flex items-center gap-2 shrink-0">
          {formData.installments > 1 && formData.amount > 0 && (
            <span className="hidden sm:inline text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {formData.installments} cuotas de {formData.currency === 'USD' ? 'U$D' : '$'}{installmentAmount.toFixed(2)}
            </span>
          )}
          {onOpenImport && (
            <button
              type="button"
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              <span>📄</span>
              <span className="hidden sm:inline">Importar resumen</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCatModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white/70 hover:bg-white rounded-xl transition-colors"
          >
            <TagIcon />
            <span className="hidden sm:inline">Gestionar categorías</span>
          </button>
        </div>
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
            <NumericInput
              value={formData.amount}
              onChange={val => setFormData({ ...formData, amount: val })}
              variant="currency"
              min={0}
              placeholder="0"
              required
              className={inputClass}
            />
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
          {cards.length === 0 && (
            <p className="mt-1.5 text-xs text-slate-400">
              ¿Tenés tarjetas?{' '}
              <button type="button" onClick={onOpenCards}
                className="font-medium text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors">
                Agregar una tarjeta →
              </button>
            </p>
          )}
          {selectedCard && !formData.recurring && (() => {
            const [yStr, mStr] = billingMonthYear.split('-');
            const monthName = MONTH_NAMES[parseInt(mStr) - 1];
            const expenseDay = parseInt(formData.date.split('-')[2]);
            const afterClosing = expenseDay >= selectedCard.closingDay;
            return (
              <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${afterClosing ? 'text-amber-600' : 'text-emerald-600'}`}>
                <span>{afterClosing ? '⚠️' : '📅'}</span>
                {afterClosing
                  ? `Pasó el cierre (día ${selectedCard.closingDay}) → se cobra en ${monthName} ${yStr}`
                  : `Antes del cierre (día ${selectedCard.closingDay}) → se cobra en ${monthName} ${yStr}`
                }
              </p>
            );
          })()}
        </div>

        {/* Categoría */}
        <div>
          <label className={labelClass}>Categoría</label>
          <CategorySelector value={formData.categoryId}
            onChange={id => setFormData({ ...formData, categoryId: id })}
            categoryType="expense"
            suggestionText={formData.description}
            className={inputClass} />
        </div>

        {/* Recurrente */}
        {formData.recurring && (
          <div>
            <label className={labelClass}>Día del mes</label>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*"
              value={formData.recurringDay ?? 1}
              onChange={e => setFormData({ ...formData, recurringDay: Math.min(28, Math.max(1, Number(e.target.value) || 1)) })}
              onFocus={e => e.target.select()}
              style={{ fontSize: '16px' }}
              className={inputClass}
              placeholder="1"
            />
            <p className="text-xs text-slate-400 mt-1">Se mostrará cada mes en este día</p>
          </div>
        )}

      </div>

      {/* Toggle recurrente */}
      <div className="mt-4 sm:max-w-sm">
        <RecurringToggle
          value={formData.recurring}
          onChange={v => setFormData({ ...formData, recurring: v, recurringDay: v ? (formData.recurringDay ?? 1) : 1 })}
          labelOn="Gasto recurrente"
          labelOff="Gasto puntual"
          descOn="Aparece automáticamente cada mes"
          descOff="Solo para el mes seleccionado"
          activeWhenTrue
        />
      </div>

      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={loading}
          className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors">
          {loading ? 'Guardando...' : 'Agregar gasto'}
        </button>
      </div>

      <CategoriesModal
        isOpen={showCatModal}
        onClose={() => setShowCatModal(false)}
        defaultType="expense"
      />
    </form>
  );
}
