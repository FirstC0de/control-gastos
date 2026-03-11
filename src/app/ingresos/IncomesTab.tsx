'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import { Income, Currency } from '../lib/types';
import CategorySelector from '../components/categories/CategorySelector';
import ConfirmModal from '../components/ui/ConfirmModal';
import BulkActionBar from '../components/ui/BulkActionBar';
import { ToastContainer, useToast } from '../components/ui/Toast';

const inputClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow";
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

const INCOME_TYPES: { value: Income['type']; label: string }[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'sales',   label: 'Ventas'  },
  { value: 'other',   label: 'Otros'   },
];

const INCOME_DEFAULT: Omit<Income, 'id'> = {
  name: '', amount: 0, type: 'monthly',
  date: new Date().toISOString().split('T')[0],
  categoryId: null, currency: 'ARS',
  recurring: false, recurringDay: undefined,
};

export default function IncomesTab() {
  const { monthlyIncomes, addIncome, updateIncome, deleteIncome, categories, selectedMonth } = useFinance();
  const incomes = monthlyIncomes;
  const { blue } = useExchangeRate();
  const { toasts, show, remove } = useToast();

  const defaultDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`;
  const [newIncome, setNewIncome]               = useState<Omit<Income, 'id'>>({ ...INCOME_DEFAULT, date: defaultDate });
  const [editingIncomeId, setEditingIncomeId]   = useState<string | null>(null);
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null);

  const resetIncome = () => { setNewIncome({ ...INCOME_DEFAULT }); setEditingIncomeId(null); };

  const handleSubmitIncome = async () => {
    if (!newIncome.name || !newIncome.amount) { show('Nombre y monto son requeridos', 'error'); return; }
    try {
      if (editingIncomeId) {
        await updateIncome(editingIncomeId, newIncome);
        show('Ingreso actualizado', 'success');
      } else {
        await addIncome(newIncome);
        show('Ingreso agregado', 'success');
      }
      resetIncome();
    } catch { show('Error al guardar ingreso', 'error'); }
  };

  const handleDeleteIncome = async () => {
    if (!deletingIncomeId) return;
    try {
      await deleteIncome(deletingIncomeId);
      show('Ingreso eliminado', 'warning');
      setDeletingIncomeId(null);
    } catch { show('Error al eliminar ingreso', 'error'); }
  };

  const startEditIncome = (income: Income) => {
    setEditingIncomeId(income.id);
    setNewIncome({
      name:         income.name,
      amount:       income.amount,
      type:         income.type,
      date:         income.date,
      categoryId:   income.categoryId ?? null,
      currency:     income.currency ?? 'ARS',
      recurring:    income.recurring ?? false,
      recurringDay: income.recurringDay,
    });
  };

  // ── Bulk ──────────────────────────────────────────────
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting]     = useState(false);
  const [selectMode, setSelectMode]         = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === incomes.length ? new Set() : new Set(incomes.map(i => i.id)));
  };

  const clearSelection = () => { setSelectedIds(new Set()); setSelectMode(false); };

  const handleBulkDelete = async () => {
    try {
      await Promise.all([...selectedIds].map(id => deleteIncome(id)));
      show(`${selectedIds.size} ingreso${selectedIds.size !== 1 ? 's' : ''} eliminado${selectedIds.size !== 1 ? 's' : ''}`, 'warning');
      clearSelection();
    } catch { show('Error al eliminar', 'error'); }
    finally { setBulkDeleting(false); }
  };

  const handleBulkCategory = async (categoryId: string | null) => {
    try {
      await Promise.all([...selectedIds].map(id => updateIncome(id, { categoryId: categoryId ?? undefined })));
      show(`Categoría actualizada en ${selectedIds.size} ingreso${selectedIds.size !== 1 ? 's' : ''}`, 'success');
      clearSelection();
    } catch { show('Error al actualizar', 'error'); }
  };

  const allSelected  = incomes.length > 0 && selectedIds.size === incomes.length;
  const someSelected = selectedIds.size > 0;

  const fmtIncome = (income: Income) => {
    if (income.currency === 'USD') {
      return (
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            U$D {income.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          {blue > 0 && (
            <p className="text-xs text-slate-400">
              ≈ ${(income.amount * blue).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </p>
          )}
        </div>
      );
    }
    return (
      <p className="text-sm font-semibold text-slate-900">
        ${income.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </p>
    );
  };

  return (
    <>
      <section className="space-y-6">

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">
            {editingIncomeId ? 'Editar ingreso' : 'Nuevo ingreso'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input type="text" value={newIncome.name}
                onChange={e => setNewIncome({ ...newIncome, name: e.target.value })}
                placeholder="Ej: Sueldo, Freelance..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Monto *</label>
              <div className="flex gap-2">
                <select
                  value={newIncome.currency ?? 'ARS'}
                  onChange={e => setNewIncome({ ...newIncome, currency: e.target.value as Currency })}
                  className="px-2 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0">
                  <option value="ARS">$</option>
                  <option value="USD">U$D</option>
                </select>
                <input type="number" value={newIncome.amount || ''}
                  onChange={e => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00" className={inputClass} min="0" step="0.01" />
              </div>
              {newIncome.currency === 'USD' && newIncome.amount > 0 && blue > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  ≈ ${(newIncome.amount * blue).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS (blue)
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={newIncome.type}
                onChange={e => setNewIncome({ ...newIncome, type: e.target.value as Income['type'] })}
                className={inputClass}>
                {INCOME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha</label>
              <input type="date" value={newIncome.date}
                onChange={e => setNewIncome({ ...newIncome, date: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Categoría</label>
              <CategorySelector
                value={newIncome.categoryId ?? null}
                onChange={id => setNewIncome({ ...newIncome, categoryId: id })}
                categoryType="income" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Recurrente</label>
              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIncome.recurring ?? false}
                    onChange={e => setNewIncome({ ...newIncome, recurring: e.target.checked })}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700">Se repite mensualmente</span>
                </label>
              </div>
            </div>
            {newIncome.recurring && (
              <div>
                <label className={labelClass}>Día del mes</label>
                <input
                  type="number"
                  min={1} max={28}
                  value={newIncome.recurringDay ?? 1}
                  onChange={e => setNewIncome({ ...newIncome, recurringDay: Math.min(28, Math.max(1, Number(e.target.value))) })}
                  className={inputClass}
                  placeholder="Ej: 1"
                />
                <p className="text-xs text-slate-400 mt-1">Se mostrará cada mes en este día</p>
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            {editingIncomeId && (
              <button onClick={resetIncome}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
            )}
            <button onClick={handleSubmitIncome}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
              {editingIncomeId ? 'Actualizar' : '+ Agregar ingreso'}
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectMode && (
                <div onClick={toggleSelectAll}
                  className={`w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-colors ${
                    allSelected ? 'bg-indigo-600 border-indigo-600'
                    : someSelected ? 'bg-indigo-200 border-indigo-400'
                    : 'border-slate-300 hover:border-indigo-400'
                  }`}>
                  {allSelected && <span className="text-white text-xs">✓</span>}
                  {!allSelected && someSelected && <span className="text-indigo-600 text-xs font-bold">−</span>}
                </div>
              )}
              <h2 className="text-base font-semibold text-slate-900">Ingresos</h2>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {incomes.length} registros
              </span>
            </div>
            <button
              onClick={() => selectMode ? clearSelection() : setSelectMode(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectMode ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {selectMode ? '✕ Cancelar' : '☑ Seleccionar'}
            </button>
          </div>

          {incomes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-3xl mb-2">💰</p>
              <p className="text-sm font-medium text-slate-500">No hay ingresos registrados</p>
              <p className="text-xs text-slate-400 mt-1">Agregá tu primer ingreso usando el formulario de arriba</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {incomes.map(income => {
                const cat        = categories.find(c => c.id === income.categoryId);
                const isSelected = selectedIds.has(income.id);

                return (
                  <li key={income.id}
                    className={`px-6 py-4 transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      {selectMode && (
                        <div onClick={() => toggleSelect(income.id)}
                          className={`w-5 h-5 rounded border-2 cursor-pointer shrink-0 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'
                          }`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || '#cbd5e1' }} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{income.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(income.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {' · '}
                              <span className="capitalize">
                                {INCOME_TYPES.find(t => t.value === income.type)?.label}
                              </span>
                              {cat && <> · <span style={{ color: cat.color }}>{cat.name}</span></>}
                              {income.currency === 'USD' && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                                  USD
                                </span>
                              )}
                              {income.recurring && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                                  ↻ Recurrente
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          <div className="text-right">{fmtIncome(income)}</div>
                          {!selectMode && (
                            <div className="flex gap-1">
                              <button onClick={() => startEditIncome(income)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                ✏️
                              </button>
                              <button onClick={() => setDeletingIncomeId(income.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <BulkActionBar
        selectedCount={selectedIds.size}
        entityType="incomes"
        onDeleteAll={() => setBulkDeleting(true)}
        onChangeCategoryAll={handleBulkCategory}
        onClearSelection={clearSelection}
      />

      <ConfirmModal
        isOpen={bulkDeleting}
        title="Eliminar ingresos"
        message={`¿Eliminar los ${selectedIds.size} ingresos seleccionados?`}
        confirmLabel="Eliminar todos" danger
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleting(false)}
      />
      <ConfirmModal
        isOpen={!!deletingIncomeId}
        title="Eliminar ingreso"
        message={`¿Eliminar "${incomes.find(i => i.id === deletingIncomeId)?.name}"?`}
        confirmLabel="Eliminar" danger
        onConfirm={handleDeleteIncome}
        onCancel={() => setDeletingIncomeId(null)}
      />
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
