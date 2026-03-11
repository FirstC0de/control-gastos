'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import { Expense } from '../lib/types';
import CategorySelector from './categories/CategorySelector';
import ConfirmModal from './ui/ConfirmModal';
import BulkActionBar from './ui/BulkActionBar';
import { ToastContainer, useToast } from './ui/Toast';

type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-desc',   label: 'Más recientes' },
  { value: 'date-asc',    label: 'Más antiguos'  },
  { value: 'amount-desc', label: 'Mayor monto'   },
  { value: 'amount-asc',  label: 'Menor monto'   },
];

const inputClass = "px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function ExpenseList() {
  const { expenses, updateExpense, deleteExpense, categories } = useFinance();
  const { blue } = useExchangeRate();
  const { toasts, show, remove } = useToast();

  // ── Filtros ───────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [filterCat, setFilterCat]     = useState<string | null>(null);
  const [filterCurrency, setFilterCurrency] = useState<'all' | 'ARS' | 'USD'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [sortKey, setSortKey]         = useState<SortKey>('date-desc');

  // Meses disponibles para el selector
  const availableMonths = useMemo(() => {
    const months = new Set(expenses.map(e => e.date.slice(0, 7)));
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  // ── Filtrado + ordenamiento ───────────────────────────
  const filtered = useMemo(() => {
    let result = [...expenses];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => e.description.toLowerCase().includes(q));
    }
    if (filterCat) {
      result = result.filter(e => e.categoryId === filterCat);
    }
    if (filterCurrency !== 'all') {
      result = result.filter(e => (e.currency ?? 'ARS') === filterCurrency);
    }
    if (filterMonth) {
      result = result.filter(e => e.date.startsWith(filterMonth));
    }

    result.sort((a, b) => {
      switch (sortKey) {
        case 'date-desc':   return b.date.localeCompare(a.date);
        case 'date-asc':    return a.date.localeCompare(b.date);
        case 'amount-desc': return b.amount - a.amount;
        case 'amount-asc':  return a.amount - b.amount;
      }
    });

    return result;
  }, [expenses, search, filterCat, filterCurrency, filterMonth, sortKey]);

  const hasFilters = search || filterCat || filterCurrency !== 'all' || filterMonth;
  const clearFilters = () => {
    setSearch(''); setFilterCat(null); setFilterCurrency('all'); setFilterMonth('');
  };

  // ── Paginación ────────────────────────────────────────
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages  = Math.ceil(filtered.length / pageSize);
  const paginated   = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Re-agrupar solo la página actual
  const paginatedGrouped = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    for (const e of paginated) {
      const key = e.date.slice(0, 7);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [paginated]);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(1); };

  // ── Edición individual ────────────────────────────────
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [currentEdits, setCurrentEdits] = useState<Partial<Expense>>({});
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [loading, setLoading]           = useState(false);

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

  // ── Selección múltiple ────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectMode, setSelectMode]   = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filtered.length
      ? new Set()
      : new Set(filtered.map(e => e.id))
    );
  };

  const clearSelection = () => { setSelectedIds(new Set()); setSelectMode(false); };

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => deleteExpense(id)));
      show(`${selectedIds.size} gasto${selectedIds.size !== 1 ? 's' : ''} eliminado${selectedIds.size !== 1 ? 's' : ''}`, 'warning');
      clearSelection();
    } catch { show('Error al eliminar', 'error'); }
    finally { setLoading(false); setBulkDeleting(false); }
  };

  const handleBulkCategoryChange = async (categoryId: string | null) => {
    setLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => updateExpense(id, { categoryId: categoryId ?? undefined })));
      show(`Categoría actualizada en ${selectedIds.size} gasto${selectedIds.size !== 1 ? 's' : ''}`, 'success');
      clearSelection();
    } catch { show('Error al actualizar categoría', 'error'); }
    finally { setLoading(false); }
  };

  // ── Helpers ───────────────────────────────────────────
  const getCat   = (id?: string | null) => categories.find(c => c.id === id);
  const fmt      = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const fmtMonth = (ym: string) => {
    const [year, month] = ym.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  const allSelected  = filtered.length > 0 && selectedIds.size === filtered.length;
  const someSelected = selectedIds.size > 0;

  const subtotalARS = (items: Expense[]) =>
    items.filter(e => e.currency !== 'USD').reduce((s, e) => s + e.amount, 0);
  const subtotalUSD = (items: Expense[]) =>
    items.filter(e => e.currency === 'USD').reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200">

        {/* ── Barra de búsqueda ── */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 space-y-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar gastos..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Categoría */}
            <div className="w-44">
              <CategorySelector
                value={filterCat}
                onChange={id => { setFilterCat(id); setPage(1); }}
                categoryType="expense"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                showManageButton={false}
                includeAllOption={true}
              />
            </div>

            {/* Moneda */}
            <select
              value={filterCurrency}
              onChange={e => { setFilterCurrency(e.target.value as 'all' | 'ARS' | 'USD'); setPage(1); }}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas las monedas</option>
              <option value="ARS">Solo ARS</option>
              <option value="USD">Solo USD</option>
            </select>

            {/* Mes */}
            <select
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los meses</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{fmtMonth(m)}</option>
              ))}
            </select>

            {/* Ordenamiento */}
            <select
              value={sortKey}
              onChange={e => { setSortKey(e.target.value as SortKey); setPage(1); }}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>

          {/* Chips de filtros activos */}
          {hasFilters && (
            <div className="flex flex-wrap gap-1.5">
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                  "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-indigo-900 ml-0.5">×</button>
                </span>
              )}
              {filterCat && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full"
                  style={{ backgroundColor: getCat(filterCat)?.color + '22', color: getCat(filterCat)?.color }}>
                  {getCat(filterCat)?.name}
                  <button onClick={() => setFilterCat(null)} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
                </span>
              )}
              {filterCurrency !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                  {filterCurrency}
                  <button onClick={() => setFilterCurrency('all')} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
                </span>
              )}
              {filterMonth && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                  {fmtMonth(filterMonth)}
                  <button onClick={() => setFilterMonth('')} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Header lista ── */}
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectMode && (
              <div
                onClick={toggleSelectAll}
                className={`w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-colors ${
                  allSelected ? 'bg-indigo-600 border-indigo-600'
                  : someSelected ? 'bg-indigo-200 border-indigo-400'
                  : 'border-slate-300 hover:border-indigo-400'
                }`}
              >
                {allSelected && <span className="text-white text-xs">✓</span>}
                {!allSelected && someSelected && <span className="text-indigo-600 text-xs font-bold">−</span>}
              </div>
            )}
            <span className="text-xs text-slate-500">
              {hasFilters
                ? <><span className="font-semibold text-slate-800">{filtered.length}</span> de {expenses.length} gastos</>
                : <><span className="font-semibold text-slate-800">{expenses.length}</span> gastos</>
              }
            </span>
          </div>

          <button
            onClick={() => selectMode ? clearSelection() : setSelectMode(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectMode ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {selectMode ? '✕ Cancelar' : '☑ Seleccionar'}
          </button>
        </div>

        {/* ── Lista agrupada por mes ── */}
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            {hasFilters ? (
              <>
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm font-medium text-slate-500">Sin resultados para esa búsqueda</p>
                <button onClick={clearFilters} className="mt-3 text-xs text-indigo-600 hover:underline">
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">💸</p>
                <p className="text-sm font-medium text-slate-500">No hay gastos registrados</p>
                <p className="text-xs text-slate-400 mt-1">Agregá tu primer gasto usando el formulario de arriba</p>
              </>
            )}
          </div>
        ) : (
          <div>
            {paginatedGrouped.map(([month, items]) => {
              const arsTotal = subtotalARS(items);
              const usdTotal = subtotalUSD(items);

              return (
                <div key={month}>
                  {/* Cabecera de mes */}
                  <div className="px-6 py-2 bg-slate-50 border-y border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {fmtMonth(month)}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {arsTotal > 0 && <span>${fmt(arsTotal)}</span>}
                      {usdTotal > 0 && <span className="text-emerald-600">U$D {fmt(usdTotal)}</span>}
                      <span className="text-slate-300">·</span>
                      <span>{items.length} {items.length === 1 ? 'gasto' : 'gastos'}</span>
                    </div>
                  </div>

                  {/* Items del mes */}
                  <ul className="divide-y divide-slate-100">
                    {items.map(expense => {
                      const cat        = getCat(expense.categoryId);
                      const isSelected = selectedIds.has(expense.id);
                      const isUSD      = expense.currency === 'USD';

                      return (
                        <li
                          key={expense.id}
                          className={`px-6 py-3.5 transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            {selectMode && (
                              <div
                                onClick={() => toggleSelect(expense.id)}
                                className={`w-5 h-5 rounded border-2 cursor-pointer shrink-0 flex items-center justify-center transition-colors ${
                                  isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'
                                }`}
                              >
                                {isSelected && <span className="text-white text-xs">✓</span>}
                              </div>
                            )}

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
                                    {/* Color de categoría */}
                                    <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold"
                                      style={{ backgroundColor: cat?.color || '#cbd5e1' }}>
                                      {expense.description.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-slate-900 truncate">
                                        {expense.description}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-xs text-slate-400">
                                          {new Date(expense.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                        </span>
                                        {cat && (
                                          <>
                                            <span className="text-slate-300 text-xs">·</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                              style={{ backgroundColor: cat.color + '22', color: cat.color }}>
                                              {cat.name}
                                            </span>
                                          </>
                                        )}
                                        {expense.installments && expense.installments > 1 && (
                                          <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                                            cuota {expense.currentInstallment}/{expense.installments}
                                          </span>
                                        )}
                                        {isUSD && (
                                          <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                            USD
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className={`shrink-0 text-right ${!selectMode ? 'flex items-center gap-2' : ''}`}>
                                    <div>
                                      <p className={`text-sm font-semibold ${isUSD ? 'text-emerald-700' : 'text-slate-900'}`}>
                                        {isUSD ? `U$D ${fmt(expense.amount)}` : `$${fmt(expense.amount)}`}
                                      </p>
                                      {isUSD && blue > 0 && (
                                        <p className="text-xs text-slate-400">
                                          ≈ ${(expense.amount * blue).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                        </p>
                                      )}
                                    </div>
                                    {!selectMode && (
                                      <div className="flex gap-1">
                                        <button onClick={() => startEditing(expense)}
                                          className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                          ✏️
                                        </button>
                                        <button onClick={() => setDeletingExpense(expense)}
                                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer paginación ── */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Mostrar</span>
              {[10, 20, 50].map(size => (
                <button key={size} onClick={() => handlePageSizeChange(size)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    pageSize === size ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {size}
                </button>
              ))}
              <span className="text-xs text-slate-400">· {filtered.length} total</span>
            </div>

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
                <span className="text-xs font-medium text-slate-700 px-2">{page} / {totalPages}</span>
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

      <BulkActionBar
        selectedCount={selectedIds.size}
        entityType="expenses"
        onDeleteAll={() => setBulkDeleting(true)}
        onChangeCategoryAll={handleBulkCategoryChange}
        onClearSelection={clearSelection}
      />

      <ConfirmModal
        isOpen={bulkDeleting}
        title="Eliminar gastos"
        message={`¿Eliminar los ${selectedIds.size} gastos seleccionados? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar todos" danger
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleting(false)}
      />
      <ConfirmModal
        isOpen={!!deletingExpense}
        title="Eliminar gasto"
        message={`¿Eliminar "${deletingExpense?.description}"?`}
        confirmLabel="Eliminar" danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingExpense(null)}
      />
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
