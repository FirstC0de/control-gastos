'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import { Expense } from '../lib/types';
import CategorySelector from './categories/CategorySelector';
import ConfirmModal from './ui/ConfirmModal';
import BulkActionBar from './ui/BulkActionBar';
import { ToastContainer, useToast } from './ui/Toast';

export default function ExpenseList() {
  const { expenses, updateExpense, deleteExpense, categories } = useFinance();
  const { blue } = useExchangeRate();
  const { toasts, show, remove } = useToast();

  // ── Paginación ────────────────────────────────────────
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages  = Math.ceil(expenses.length / pageSize);
  const paginated   = expenses.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  // ── Edición / eliminación individual ─────────────────
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [currentEdits, setCurrentEdits]     = useState<Partial<Expense>>({});
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [loading, setLoading]               = useState(false);

  // ── Selección múltiple ────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectMode, setSelectMode]   = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === expenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.map(e => e.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  // ── Bulk delete ───────────────────────────────────────
  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => deleteExpense(id)));
      show(`${selectedIds.size} gasto${selectedIds.size !== 1 ? 's' : ''} eliminado${selectedIds.size !== 1 ? 's' : ''}`, 'warning');
      clearSelection();
    } catch {
      show('Error al eliminar', 'error');
    } finally {
      setLoading(false);
      setBulkDeleting(false);
    }
  };

  // ── Bulk category change ──────────────────────────────
  const handleBulkCategoryChange = async (categoryId: string | null) => {
    setLoading(true);
    try {
      await Promise.all(
        [...selectedIds].map(id => updateExpense(id, { categoryId: categoryId ?? undefined }))
      );
      show(`Categoría actualizada en ${selectedIds.size} gasto${selectedIds.size !== 1 ? 's' : ''}`, 'success');
      clearSelection();
    } catch {
      show('Error al actualizar categoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Edición individual ────────────────────────────────
  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setCurrentEdits({
      description: expense.description,
      amount:      expense.amount,
      categoryId:  expense.categoryId,
      currency:    expense.currency,
    });
  };

  const saveEditing = async (id: string) => {
    setLoading(true);
    try {
      await updateExpense(id, currentEdits);
      show('Gasto actualizado', 'success');
      setEditingId(null);
    } catch { show('Error al actualizar', 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setLoading(true);
    try {
      await deleteExpense(deletingExpense.id);
      show(`"${deletingExpense.description}" eliminado`, 'warning');
      setDeletingExpense(null);
    } catch { show('Error al eliminar', 'error'); }
    finally { setLoading(false); }
  };

  // ── Helpers ───────────────────────────────────────────
  const getCat = (id?: string | null) => categories.find(c => c.id === id);
  const inputClass = "px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

  const allSelected  = expenses.length > 0 && selectedIds.size === expenses.length;
  const someSelected = selectedIds.size > 0;

  const formatMonto = (expense: Expense) => {
    if (expense.currency === 'USD') {
      return `U$D ${expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    }
    return `$${expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectMode && (
              <div
                onClick={toggleSelectAll}
                className={`w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-colors ${
                  allSelected
                    ? 'bg-indigo-600 border-indigo-600'
                    : someSelected
                    ? 'bg-indigo-200 border-indigo-400'
                    : 'border-slate-300 hover:border-indigo-400'
                }`}
              >
                {allSelected  && <span className="text-white text-xs">✓</span>}
                {!allSelected && someSelected && <span className="text-indigo-600 text-xs font-bold">−</span>}
              </div>
            )}
            <h2 className="text-base font-semibold text-slate-900">Gastos</h2>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {expenses.length} registros
            </span>
          </div>

          <button
            onClick={() => {
              if (selectMode) { clearSelection(); } else { setSelectMode(true); }
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectMode
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {selectMode ? '✕ Cancelar' : '☑ Seleccionar'}
          </button>
        </div>

        {/* Lista */}
        {expenses.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-sm font-medium text-slate-500">No hay gastos registrados</p>
            <p className="text-xs text-slate-400 mt-1">Agregá tu primer gasto usando el formulario de arriba</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {paginated.map(expense => {
              const cat        = getCat(expense.categoryId);
              const isSelected = selectedIds.has(expense.id);
              const isUSD      = expense.currency === 'USD';

              return (
                <li
                  key={expense.id}
                  className={`px-6 py-4 transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">

                    {/* Checkbox */}
                    {selectMode && (
                      <div
                        onClick={() => toggleSelect(expense.id)}
                        className={`w-5 h-5 rounded border-2 cursor-pointer shrink-0 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                    )}

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      {editingId === expense.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input type="text" value={currentEdits.description || ''}
                            onChange={e => setCurrentEdits(p => ({ ...p, description: e.target.value }))}
                            className={`${inputClass} w-40`} placeholder="Descripción" />
                          <div className="flex gap-1">
                            <select
                              value={currentEdits.currency || 'ARS'}
                              onChange={e => setCurrentEdits(p => ({ ...p, currency: e.target.value as 'ARS' | 'USD' }))}
                              className={`${inputClass} w-16`}>
                              <option value="ARS">$</option>
                              <option value="USD">U$D</option>
                            </select>
                            <input type="number" value={currentEdits.amount || ''}
                              onChange={e => setCurrentEdits(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                              className={`${inputClass} w-24`} step="0.01" min="0" />
                          </div>
                          <div className="w-40">
                            <CategorySelector
                              value={currentEdits.categoryId ?? null}
                              onChange={id => setCurrentEdits(p => ({ ...p, categoryId: id ?? undefined }))}
                              categoryType="expense" className={inputClass} showManageButton={false} />
                          </div>
                          <button onClick={() => saveEditing(expense.id)} disabled={loading}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
                            Guardar
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat?.color || '#cbd5e1' }} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {expense.description}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(expense.date).toLocaleDateString('es-AR', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })}
                                {cat && <> · <span style={{ color: cat.color }}>{cat.name}</span></>}
                                {expense.installments && expense.installments > 1 && (
                                  <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                    {expense.currentInstallment}/{expense.installments}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Monto */}
                          <div className={`shrink-0 text-right ${!selectMode ? 'flex items-center gap-3' : ''}`}>
                            <div>
                              <p className={`text-sm font-semibold ${isUSD ? 'text-emerald-700' : 'text-slate-900'}`}>
                                {formatMonto(expense)}
                              </p>
                              {/* Conversión ARS si es USD */}
                              {isUSD && blue > 0 && (
                                <p className="text-xs text-slate-400">
                                  ≈ ${(expense.amount * blue).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                </p>
                              )}
                            </div>
                            {!selectMode && (
                              <div className="flex gap-1">
                                <button onClick={() => startEditing(expense)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                  ✏️
                                </button>
                                <button onClick={() => setDeletingExpense(expense)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer paginación */}
        {expenses.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">

            {/* Selector de tamaño */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Mostrar</span>
              {[10, 20, 50].map(size => (
                <button key={size} onClick={() => handlePageSizeChange(size)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    pageSize === size
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {size}
                </button>
              ))}
              <span className="text-xs text-slate-400">· {expenses.length} total</span>
            </div>

            {/* Navegación */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors">
                  «
                </button>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                  className="px-3 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors">
                  ‹ Ant
                </button>
                <span className="text-xs font-medium text-slate-700 px-2">
                  {page} / {totalPages}
                </span>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                  className="px-3 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors">
                  Sig ›
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors">
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        entityType="expenses"
        onDeleteAll={() => setBulkDeleting(true)}
        onChangeCategoryAll={handleBulkCategoryChange}
        onClearSelection={clearSelection}
      />

      {/* Modales */}
      <ConfirmModal
        isOpen={bulkDeleting}
        title="Eliminar gastos"
        message={`¿Eliminar los ${selectedIds.size} gastos seleccionados? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar todos"
        danger
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleting(false)}
      />
      <ConfirmModal
        isOpen={!!deletingExpense}
        title="Eliminar gasto"
        message={`¿Eliminar "${deletingExpense?.description}"?`}
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingExpense(null)}
      />
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
