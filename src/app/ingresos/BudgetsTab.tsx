'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '../lib/types';
import CategorySelector from '../components/categories/CategorySelector';
import ConfirmModal from '../components/ui/ConfirmModal';
import { ToastContainer, useToast } from '../components/ui/Toast';

const inputClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow";
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

const BUDGET_PERIODS: { value: Budget['period']; label: string }[] = [
  { value: 'monthly', label: 'Mensual'       },
  { value: 'weekly',  label: 'Semanal'       },
  { value: 'custom',  label: 'Personalizado' },
];

const BUDGET_DEFAULT: Omit<Budget, 'id' | 'spent'> = {
  name: '', categoryId: null, amount: 0, period: 'monthly',
};

export default function BudgetsTab() {
  const { budgets, addBudget, updateBudget, deleteBudget, monthlyExpenses, categories } = useFinance();
  const { toasts, show, remove } = useToast();

  const [newBudget, setNewBudget]               = useState<Omit<Budget, 'id' | 'spent'>>({ ...BUDGET_DEFAULT });
  const [editingBudgetId, setEditingBudgetId]   = useState<string | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  const resetBudget = () => { setNewBudget({ ...BUDGET_DEFAULT }); setEditingBudgetId(null); };

  const handleSubmitBudget = async () => {
    if (!newBudget.name || !newBudget.amount) { show('Nombre y monto son requeridos', 'error'); return; }
    if (!newBudget.categoryId) { show('Debés asignar una categoría al presupuesto', 'error'); return; }
    try {
      if (editingBudgetId) {
        await updateBudget(editingBudgetId, newBudget);
        show('Presupuesto actualizado', 'success');
      } else {
        await addBudget(newBudget);
        show('Presupuesto agregado', 'success');
      }
      resetBudget();
    } catch { show('Error al guardar presupuesto', 'error'); }
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudgetId) return;
    try {
      await deleteBudget(deletingBudgetId);
      show('Presupuesto eliminado', 'warning');
      setDeletingBudgetId(null);
    } catch { show('Error al eliminar presupuesto', 'error'); }
  };

  const startEditBudget = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setNewBudget({ name: budget.name, categoryId: budget.categoryId ?? null, amount: budget.amount, period: budget.period });
  };

  return (
    <>
      <section className="space-y-6">

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">
            {editingBudgetId ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input type="text" value={newBudget.name}
                onChange={e => setNewBudget({ ...newBudget, name: e.target.value })}
                placeholder="Ej: Supermercado..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Monto *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={newBudget.amount || ''}
                  onChange={e => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00" className={`${inputClass} pl-7`} min="0" step="0.01" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Categoría *</label>
              <CategorySelector
                value={newBudget.categoryId ?? null}
                onChange={id => setNewBudget({ ...newBudget, categoryId: id })}
                categoryType="expense" className={inputClass} showManageButton={false} />
            </div>
            <div>
              <label className={labelClass}>Período</label>
              <select value={newBudget.period}
                onChange={e => setNewBudget({ ...newBudget, period: e.target.value as Budget['period'] })}
                className={inputClass}>
                {BUDGET_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            {editingBudgetId && (
              <button onClick={resetBudget}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
            )}
            <button onClick={handleSubmitBudget}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
              {editingBudgetId ? 'Actualizar' : '+ Agregar presupuesto'}
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Presupuestos</h2>
          </div>

          {budgets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm font-medium text-slate-500">No hay presupuestos registrados</p>
              <p className="text-xs text-slate-400 mt-1">Agregá tu primer presupuesto usando el formulario de arriba</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {budgets.map(budget => {
                const cat       = categories.find(c => c.id === budget.categoryId);
                const spent     = monthlyExpenses
                  .filter(e => e.categoryId === budget.categoryId)
                  .reduce((sum, e) => sum + e.amount, 0);
                const remaining = budget.amount - spent;
                const pct       = Math.min((spent / budget.amount) * 100, 100);
                const over      = spent > budget.amount;

                return (
                  <li key={budget.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {cat?.color && (
                            <div className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }} />
                          )}
                          <p className="text-sm font-medium text-slate-900">{budget.name}</p>
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {BUDGET_PERIODS.find(p => p.value === budget.period)?.label}
                          </span>
                        </div>
                        {cat && (
                          <p className="text-xs text-slate-400 mt-0.5 ml-4.5">{cat.name}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            ${spent.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                            <span className="text-slate-400 font-normal">
                              {' '}/ ${budget.amount.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                            </span>
                          </p>
                          <p className={`text-xs font-medium ${over ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {over
                              ? `Excedido $${Math.abs(remaining).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
                              : `Restante $${remaining.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
                            }
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEditBudget(budget)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            ✏️
                          </button>
                          <button onClick={() => setDeletingBudgetId(budget.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <ConfirmModal
        isOpen={!!deletingBudgetId}
        title="Eliminar presupuesto"
        message={`¿Eliminar "${budgets.find(b => b.id === deletingBudgetId)?.name}"?`}
        confirmLabel="Eliminar" danger
        onConfirm={handleDeleteBudget}
        onCancel={() => setDeletingBudgetId(null)}
      />
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
