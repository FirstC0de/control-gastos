'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import CategorySelector from './categories/CategorySelector';
import ConfirmModal from './ui/ConfirmModal';
import { ToastContainer, useToast } from './ui/Toast';

export default function SummaryCard() {
  const { expenses, categories, budgets, deleteBudget, updateBudget } = useFinance();
  const { blue } = useExchangeRate();
  const { toasts, show, remove } = useToast();
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [editingBudgetId, setEditingBudgetId]   = useState<string | null>(null);
  const [budgetEdits, setBudgetEdits] = useState<{ name: string; amount: number; categoryId: string | null | undefined }>
    ({ name: '', amount: 0, categoryId: null });

  // ── Gastos por categoría (USD convertido a ARS) ───────
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const cat    = categories.find(c => c.id === expense.categoryId);
    const name   = cat?.name  || 'Sin categoría';
    const color  = cat?.color || '#94a3b8';
    const amount = expense.currency === 'USD' ? expense.amount * (blue || 0) : expense.amount;
    if (!acc[name]) acc[name] = { amount: 0, color };
    acc[name].amount += amount;
    return acc;
  }, {} as Record<string, { amount: number; color: string }>);

  // ── Presupuestos (USD convertido a ARS) ───────────────
  const budgetsWithRemaining = budgets.map(b => {
    const spent      = expenses
      .filter(e => e.categoryId === b.categoryId)
      .reduce((s, e) => s + (e.currency === 'USD' ? e.amount * (blue || 0) : e.amount), 0);
    const remaining  = b.amount - spent;
    const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const category   = categories.find(c => c.id === b.categoryId);
    return { ...b, spent, remaining, percentage, category };
  });

  const startEditing = (b: typeof budgetsWithRemaining[0]) => {
    setEditingBudgetId(b.id);
    setBudgetEdits({ name: b.name, amount: b.amount, categoryId: b.categoryId });
  };

  const saveEdit = async () => {
    if (!editingBudgetId) return;
    try {
      await updateBudget(editingBudgetId, { ...budgetEdits, categoryId: budgetEdits.categoryId ?? null });
      show('Presupuesto actualizado', 'success');
      setEditingBudgetId(null);
    } catch { show('Error al actualizar', 'error'); }
  };

  const handleDelete = async () => {
    if (!deletingBudgetId) return;
    try {
      await deleteBudget(deletingBudgetId);
      show('Presupuesto eliminado', 'warning');
      setDeletingBudgetId(null);
    } catch { show('Error al eliminar', 'error'); }
  };

  const fmt        = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const inputClass = "w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">

        {/* Presupuestos */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Presupuestos</h3>
          {budgetsWithRemaining.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No hay presupuestos creados</p>
          ) : (
            <div className="space-y-3">
              {budgetsWithRemaining.map(b => (
                <div key={b.id} className="rounded-xl border border-slate-100 p-3"
                  style={{ borderLeftColor: b.category?.color, borderLeftWidth: 3 }}>
                  {editingBudgetId === b.id ? (
                    <div className="space-y-2">
                      <input className={inputClass} value={budgetEdits.name}
                        onChange={e => setBudgetEdits(p => ({ ...p, name: e.target.value }))} placeholder="Nombre" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" className={inputClass} value={budgetEdits.amount}
                          onChange={e => setBudgetEdits(p => ({ ...p, amount: Number(e.target.value) }))} />
                        <CategorySelector value={budgetEdits.categoryId ?? null}
                          onChange={id => setBudgetEdits(p => ({ ...p, categoryId: id }))}
                          categoryType="expense" className={inputClass} showManageButton={false} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingBudgetId(null)}
                          className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                          Cancelar
                        </button>
                        <button onClick={saveEdit}
                          className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!b.category && (
                        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mb-2">
                          ⚠ Sin categoría — asigná una para rastrear gastos
                        </p>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{b.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {b.category
                              ? <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                  style={{ backgroundColor: b.category.color + '22', color: b.category.color }}>
                                  {b.category.name}
                                </span>
                              : <span className="text-xs text-amber-500">Sin categoría</span>
                            }
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs font-semibold text-slate-700">${fmt(b.amount)}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEditing(b)}
                            className="p-1 text-slate-300 hover:text-indigo-500 transition-colors text-xs">✏️</button>
                          <button onClick={() => setDeletingBudgetId(b.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 transition-colors text-xs">🗑️</button>
                        </div>
                      </div>
                      {b.category && (
                        <>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs text-slate-400">
                              <span className="font-semibold text-slate-700">${fmt(b.spent)}</span>
                              <span className="text-slate-300"> / ${fmt(b.amount)}</span>
                            </span>
                            <span className={`text-xs font-bold ${b.percentage > 80 ? 'text-rose-600' : b.percentage > 50 ? 'text-amber-500' : 'text-emerald-600'}`}>
                              {b.percentage.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${
                              b.percentage > 80 ? 'bg-rose-500' : b.percentage > 50 ? 'bg-amber-400' : 'bg-emerald-500'
                            }`} style={{ width: `${Math.min(100, b.percentage)}%` }} />
                          </div>
                          <p className={`text-xs mt-1.5 font-bold ${b.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {b.remaining >= 0 ? `$${fmt(b.remaining)} disponible` : `$${fmt(Math.abs(b.remaining))} excedido`}
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gastos por categoría */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Por categoría</h3>
          {Object.keys(expensesByCategory).length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Sin gastos registrados</p>
          ) : (() => {
            const sorted = Object.entries(expensesByCategory).sort((a, b) => b[1].amount - a[1].amount);
            const maxAmount = sorted[0]?.[1].amount || 1;
            const totalCat = sorted.reduce((s, [, d]) => s + d.amount, 0);
            return (
              <div className="space-y-3">
                {sorted.map(([name, data]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                        <span className="text-xs font-medium text-slate-700 truncate">{name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-sm font-bold text-slate-900">${fmt(data.amount)}</span>
                        <span className="text-xs text-slate-400 w-8 text-right">
                          {(data.amount / totalCat * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1">
                      <div className="h-1 rounded-full transition-all"
                        style={{ width: `${(data.amount / maxAmount) * 100}%`, backgroundColor: data.color }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Total gastos</span>
                  <span className="text-sm font-bold text-slate-900">${fmt(totalCat)}</span>
                </div>
              </div>
            );
          })()}
        </div>

      </div>

      <ConfirmModal isOpen={!!deletingBudgetId} title="Eliminar presupuesto"
        message="¿Eliminar este presupuesto?" confirmLabel="Eliminar" danger
        onConfirm={handleDelete} onCancel={() => setDeletingBudgetId(null)} />
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
