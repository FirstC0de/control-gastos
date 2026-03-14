'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import { Budget } from '@controlados/shared';
import CategorySelector from '../components/categories/CategorySelector';
import CategoriesModal from '../components/categories/CategoriesModal';
import RecurringToggle from '../components/ui/RecurringToggle';
import ConfirmModal from '../components/ui/ConfirmModal';
import { ToastContainer, useToast } from '../components/ui/Toast';

const TagIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const inputClass  = "w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow";
const labelClass  = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

const EMPTY: Omit<Budget, 'id' | 'spent'> = {
  name: '', categoryId: null, amount: 0, period: 'monthly', recurring: false, alertThreshold: 80,
};

export default function BudgetsTab() {
  const {
    budgets, monthlyBudgets, monthlyExpenses, categories,
    addBudget, updateBudget, deleteBudget, selectedMonth,
    copyBudgetsFromPreviousMonth,
  } = useFinance();
  const { blue } = useExchangeRate();
  const { toasts, show, remove } = useToast();

  const [form, setForm]                         = useState<Omit<Budget, 'id' | 'spent'>>({ ...EMPTY });
  const [editingId, setEditingId]               = useState<string | null>(null);
  const [deletingId, setDeletingId]             = useState<string | null>(null);
  const [loading, setLoading]                   = useState(false);
  const [showCatModal, setShowCatModal]         = useState(false);
  const [copying, setCopying]                   = useState(false);

  const monthLabel = new Date(selectedMonth.year, selectedMonth.month, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const reset = () => { setForm({ ...EMPTY }); setEditingId(null); };

  const startEdit = (b: Budget) => {
    setEditingId(b.id);
    setForm({ name: b.name, categoryId: b.categoryId ?? null, amount: b.amount, period: b.period, recurring: b.recurring ?? false, alertThreshold: b.alertThreshold ?? 80 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { show('El nombre es requerido', 'error'); return; }
    if (form.amount <= 0)  { show('El monto debe ser mayor a 0', 'error'); return; }

    setLoading(true);
    const monthYear = form.recurring
      ? undefined
      : `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;

    try {
      if (editingId) {
        await updateBudget(editingId, { ...form, monthYear: monthYear ?? undefined });
        show('Presupuesto actualizado', 'success');
      } else {
        await addBudget({ ...form, ...(monthYear ? { monthYear } : {}) });
        show('Presupuesto creado', 'success');
      }
      reset();
    } catch { show('Error al guardar el presupuesto', 'error'); }
    finally { setLoading(false); }
  };

  const handleCopyFromPrevMonth = async () => {
    setCopying(true);
    try {
      const count = await copyBudgetsFromPreviousMonth();
      if (count > 0) show(`${count} presupuesto${count !== 1 ? 's' : ''} copiado${count !== 1 ? 's' : ''} del mes anterior`, 'success');
      else show('No hay presupuestos nuevos para copiar', 'warning');
    } catch { show('Error al copiar presupuestos', 'error'); }
    finally { setCopying(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteBudget(deletingId);
      show('Presupuesto eliminado', 'warning');
      setDeletingId(null);
    } catch { show('Error al eliminar', 'error'); }
  };

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 0 });

  // Presupuestos del mes con cálculos
  const budgetsWithData = monthlyBudgets.map(b => {
    const cat  = categories.find(c => c.id === b.categoryId);
    const spent = monthlyExpenses
      .filter(e => e.categoryId === b.categoryId)
      .reduce((s, e) => s + (e.currency === 'USD' ? e.amount * (blue || 0) : e.amount), 0);
    const remaining  = b.amount - spent;
    const pct        = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
    const over       = spent > b.amount;
    return { ...b, cat, spent, remaining, pct, over };
  });

  return (
    <>
      <section className="space-y-6">

        {/* ── Formulario ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-2 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl bg-linear-to-r from-indigo-50 to-slate-50 border-b border-indigo-100">
            <h2 className="text-lg font-bold text-indigo-900 tracking-tight">
              {editingId ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            </h2>
            <button
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white/70 hover:bg-white rounded-xl transition-colors shrink-0"
            >
              <TagIcon />
              <span className="hidden sm:inline">Gestionar categorías</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nombre */}
            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Supermercado, Salidas..."
                className={inputClass}
              />
            </div>

            {/* Monto */}
            <div>
              <label className={labelClass}>Monto *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  value={form.amount || ''}
                  onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  step="100"
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className={labelClass}>Categoría</label>
              <CategorySelector
                value={form.categoryId ?? null}
                onChange={id => setForm(p => ({ ...p, categoryId: id }))}
                categoryType="expense"
                className={inputClass}
                showManageButton={false}
              />
            </div>

            {/* Umbral de alerta */}
            <div>
              <label className={labelClass}>Alerta al <span className="text-indigo-600">{form.alertThreshold ?? 80}%</span></label>
              <div className="flex items-center gap-3 pt-1.5">
                <input
                  type="range"
                  min={50} max={100} step={5}
                  value={form.alertThreshold ?? 80}
                  onChange={e => setForm(p => ({ ...p, alertThreshold: parseInt(e.target.value) }))}
                  className="flex-1 h-2 rounded-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-500 w-8 text-right">{form.alertThreshold ?? 80}%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Aviso cuando el gasto supere este porcentaje</p>
            </div>
          </div>

          {/* Toggle recurrente */}
          <div className="mt-4 sm:max-w-sm">
            <RecurringToggle
              value={form.recurring ?? false}
              onChange={v => setForm(p => ({ ...p, recurring: v }))}
              labelOn="Recurrente (todos los meses)"
              labelOff="Solo este mes"
              descOn="Se aplica a partir del mes actual"
              descOff={`Solo para ${monthLabel}`}
            />
          </div>

          {/* Acciones */}
          <div className="mt-5 flex justify-end gap-2">
            {editingId && (
              <button
                onClick={reset}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando...' : editingId ? 'Actualizar presupuesto' : 'Agregar presupuesto'}
            </button>
          </div>
        </div>

        {/* ── Lista ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="px-6 py-4 border-b border-indigo-100 flex items-center gap-3 rounded-t-2xl bg-linear-to-r from-indigo-50 to-slate-50">
            <h2 className="flex-1 text-lg font-bold text-indigo-900 tracking-tight">Presupuestos</h2>
            <span className="hidden sm:inline text-xs font-medium text-slate-500 bg-white/70 px-2.5 py-1 rounded-full shrink-0">
              {budgetsWithData.length} activos · {budgets.filter(b => b.recurring).length} recurrentes
            </span>
            <button
              onClick={handleCopyFromPrevMonth}
              disabled={copying}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white/70 hover:bg-white rounded-xl transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copying ? 'Copiando...' : 'Copiar mes anterior'}
            </button>
          </div>

          {budgetsWithData.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm font-medium text-slate-500">Sin presupuestos para este mes</p>
              <p className="text-xs text-slate-400 mt-1">Creá uno con el formulario de arriba</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {budgetsWithData.map(b => (
                <li
                  key={b.id}
                  className="px-6 py-4 hover:bg-slate-50/70 transition-colors"
                  style={{ borderLeft: `3px solid ${b.cat?.color || '#e2e8f0'}` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {b.cat?.color && (
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.cat.color }} />
                        )}
                        <p className="text-sm font-semibold text-slate-900">{b.name}</p>
                        {b.recurring && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 font-medium">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Recurrente
                          </span>
                        )}
                        {!b.recurring && b.monthYear && (
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full capitalize">
                            {new Date(b.monthYear + '-01T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {b.cat ? (
                        <p className="text-xs mt-1 pl-4" style={{ color: b.cat.color }}>{b.cat.name}</p>
                      ) : (
                        <p className="text-xs mt-1 pl-4 text-amber-500">⚠ Sin categoría — no rastrea gastos</p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold font-mono tabular-nums text-slate-900">
                          ${fmt(b.spent)}
                          <span className="text-slate-400 font-normal text-xs"> / ${fmt(b.amount)}</span>
                        </p>
                        <p className={`text-xs font-semibold font-mono tabular-nums ${b.over ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {b.over
                            ? `Excedido $${fmt(Math.abs(b.remaining))}`
                            : `$${fmt(b.remaining)} disponible`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(b)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >✏️</button>
                        <button
                          onClick={() => setDeletingId(b.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >🗑️</button>
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {b.cat && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              b.over ? 'bg-rose-500' : b.pct > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${b.pct}%` }}
                          />
                        </div>
                        <span className={`ml-3 text-xs font-bold tabular-nums shrink-0 ${
                          b.over ? 'text-rose-600' : b.pct > 80 ? 'text-amber-500' : 'text-emerald-600'
                        }`}>
                          {b.pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <CategoriesModal
        isOpen={showCatModal}
        onClose={() => setShowCatModal(false)}
        defaultType="expense"
      />
      <ConfirmModal
        isOpen={!!deletingId}
        title="Eliminar presupuesto"
        message={`¿Eliminar "${budgets.find(b => b.id === deletingId)?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
