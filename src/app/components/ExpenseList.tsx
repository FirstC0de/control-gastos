'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import { Expense } from '../lib/types';
import CategorySelector from './categories/CategorySelector';
import ConfirmModal from './ui/ConfirmModal';
import BulkActionBar from './ui/BulkActionBar';
import { ToastContainer, useToast } from './ui/Toast';

// ── Icons ────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const XIcon = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <svg className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
  </svg>
);
const CardIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

export default function ExpenseList() {
  const { monthlyExpenses, updateExpense, deleteExpense, categories, cards } = useFinance();
  const { blue } = useExchangeRate();
  const { toasts, show, remove } = useToast();

  // ── Filtros ───────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [cardFilter, setCardFilter]   = useState<string>('');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'ARS' | 'USD'>('ALL');

  const filteredExpenses = useMemo(() => {
    return monthlyExpenses.filter(e => {
      if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && e.categoryId !== categoryFilter) return false;
      if (cardFilter) {
        if (cardFilter === '__none__' && e.cardId) return false;
        if (cardFilter !== '__none__' && e.cardId !== cardFilter) return false;
      }
      if (currencyFilter !== 'ALL' && e.currency !== currencyFilter) return false;
      return true;
    });
  }, [monthlyExpenses, search, categoryFilter, cardFilter, currencyFilter]);

  const activeFilterCount = [
    search, categoryFilter, cardFilter, currencyFilter !== 'ALL' ? currencyFilter : '',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setCardFilter('');
    setCurrencyFilter('ALL');
  };

  // ── Paginación ────────────────────────────────────────
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages  = Math.ceil(filteredExpenses.length / pageSize);
  const paginated   = filteredExpenses.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(1); };

  // Reset page when filters change
  useMemo(() => { setPage(1); }, [filteredExpenses.length]);

  // ── Edición / eliminación individual ─────────────────
  const [editingId, setEditingId]            = useState<string | null>(null);
  const [currentEdits, setCurrentEdits]      = useState<Partial<Expense>>({});
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [loading, setLoading]                = useState(false);

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
    setSelectedIds(
      selectedIds.size === filteredExpenses.length
        ? new Set()
        : new Set(filteredExpenses.map(e => e.id))
    );
  };

  const clearSelection = () => { setSelectedIds(new Set()); setSelectMode(false); };

  // ── Bulk actions ──────────────────────────────────────
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

  const handleBulkCardChange = async (cardId: string | null) => {
    setLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => updateExpense(id, { cardId: cardId ?? undefined })));
      show(`Tarjeta actualizada en ${selectedIds.size} gasto${selectedIds.size !== 1 ? 's' : ''}`, 'success');
      clearSelection();
    } catch { show('Error al actualizar tarjeta', 'error'); }
    finally { setLoading(false); }
  };

  // ── Edición individual ────────────────────────────────
  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setCurrentEdits({
      description: expense.description,
      amount:      expense.amount,
      categoryId:  expense.categoryId,
      currency:    expense.currency,
      cardId:      expense.cardId,
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
  const getCat  = (id?: string | null) => categories.find(c => c.id === id);
  const getCard = (id?: string | null) => cards.find(c => c.id === id);
  const inputClass = "px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

  const allSelected  = filteredExpenses.length > 0 && selectedIds.size === filteredExpenses.length;
  const someSelected = selectedIds.size > 0;

  const formatMonto = (expense: Expense) => {
    if (expense.currency === 'USD') {
      return `U$D ${expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    }
    return `$${expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  };

  // Categorías y tarjetas presentes en el mes actual
  const presentCategoryIds = useMemo(() => new Set(monthlyExpenses.map(e => e.categoryId).filter(Boolean)), [monthlyExpenses]);
  const presentCardIds     = useMemo(() => new Set(monthlyExpenses.map(e => e.cardId).filter(Boolean)), [monthlyExpenses]);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-indigo-100 relative flex items-center rounded-t-2xl bg-linear-to-r from-indigo-50 to-slate-50">
          <div className="w-8 shrink-0">
            {selectMode && (
              <div
                onClick={toggleSelectAll}
                className={`w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-colors ${
                  allSelected ? 'bg-indigo-600 border-indigo-600'
                  : someSelected ? 'bg-indigo-200 border-indigo-400'
                  : 'border-slate-300 hover:border-indigo-400'
                }`}
              >
                {allSelected   && <span className="text-white text-xs">✓</span>}
                {!allSelected && someSelected && <span className="text-indigo-600 text-xs font-bold">−</span>}
              </div>
            )}
          </div>
          <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-indigo-900 tracking-tight whitespace-nowrap">Gastos</h2>
          <button
            onClick={() => selectMode ? clearSelection() : setSelectMode(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectMode ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              : 'bg-white/70 text-slate-600 hover:bg-white'
            }`}
          >
            {selectMode ? '✕ Cancelar' : '☑ Seleccionar'}
          </button>
        </div>

        {/* ── Barra de filtros ─────────────────────────────── */}
        <div className="px-6 py-3 border-b border-slate-100 space-y-3">

          {/* Fila 1: búsqueda + filtros */}
          <div className="flex flex-wrap gap-2">

            {/* Búsqueda */}
            <div className="relative flex-1 min-w-45">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por descripción..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XIcon size="sm" />
                </button>
              )}
            </div>

            {/* Filtro categoría */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className={`py-2 pl-3 pr-8 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition cursor-pointer ${
                categoryFilter ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600'
              }`}
            >
              <option value="">Todas las categorías</option>
              {categories
                .filter(c => c.type === 'expense' || c.type === 'both')
                .filter(c => presentCategoryIds.has(c.id))
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>

            {/* Filtro tarjeta */}
            <select
              value={cardFilter}
              onChange={e => setCardFilter(e.target.value)}
              className={`py-2 pl-3 pr-8 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition cursor-pointer ${
                cardFilter ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600'
              }`}
            >
              <option value="">Todas las tarjetas</option>
              <option value="__none__">Sin tarjeta</option>
              {cards
                .filter(c => presentCardIds.has(c.id))
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>

            {/* Filtro moneda */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
              {(['ALL', 'ARS', 'USD'] as const).map(cur => (
                <button
                  key={cur}
                  onClick={() => setCurrencyFilter(cur)}
                  className={`px-3 py-2 font-medium transition-colors ${
                    currencyFilter === cur
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cur === 'ALL' ? 'Todas' : cur === 'ARS' ? '$' : 'U$D'}
                </button>
              ))}
            </div>

            {/* Limpiar filtros */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
              >
                <FilterIcon />
                Limpiar
                <span className="bg-rose-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              </button>
            )}
          </div>

          {/* Fila 2: chips de filtros activos */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                  Búsqueda: &quot;{search}&quot;
                  <button onClick={() => setSearch('')} className="hover:text-indigo-900 ml-0.5"><XIcon size="sm" /></button>
                </span>
              )}
              {categoryFilter && (() => {
                const cat = getCat(categoryFilter);
                return cat ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                    <button onClick={() => setCategoryFilter('')} className="ml-0.5 opacity-70 hover:opacity-100"><XIcon size="sm" /></button>
                  </span>
                ) : null;
              })()}
              {cardFilter && cardFilter !== '__none__' && (() => {
                const card = getCard(cardFilter);
                return card ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
                    <CardIcon />
                    {card.name}
                    <button onClick={() => setCardFilter('')} className="ml-0.5 opacity-70 hover:opacity-100"><XIcon size="sm" /></button>
                  </span>
                ) : null;
              })()}
              {cardFilter === '__none__' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                  Sin tarjeta
                  <button onClick={() => setCardFilter('')} className="ml-0.5 opacity-70 hover:opacity-100"><XIcon size="sm" /></button>
                </span>
              )}
              {currencyFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  Moneda: {currencyFilter}
                  <button onClick={() => setCurrencyFilter('ALL')} className="ml-0.5 opacity-70 hover:opacity-100"><XIcon size="sm" /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Lista ────────────────────────────────────────── */}
        {monthlyExpenses.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-sm font-medium text-slate-500">No hay gastos registrados</p>
            <p className="text-xs text-slate-400 mt-1">Agregá tu primer gasto usando el formulario de arriba</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-medium text-slate-500">Sin resultados</p>
            <p className="text-xs text-slate-400 mt-1">Probá con otros filtros o</p>
            <button onClick={clearAllFilters} className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2">
              limpiar todos los filtros
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {paginated.map(expense => {
              const cat        = getCat(expense.categoryId);
              const card       = getCard(expense.cardId);
              const isSelected = selectedIds.has(expense.id);
              const isUSD      = expense.currency === 'USD';

              return (
                <li
                  key={expense.id}
                  className={`px-6 py-3.5 transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50/70'}`}
                >
                  <div className="flex items-center gap-3">

                    {/* Checkbox */}
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

                    {/* Dot de categoría */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white"
                      style={{ backgroundColor: cat?.color || '#cbd5e1' }}
                    />

                    {/* Contenido principal */}
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
                          <select
                            value={currentEdits.cardId ?? ''}
                            onChange={e => setCurrentEdits(p => ({ ...p, cardId: e.target.value || undefined }))}
                            className={`${inputClass} w-36`}>
                            <option value="">Sin tarjeta</option>
                            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
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
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          {/* Descripción + meta */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate leading-tight">
                              {expense.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-xs text-slate-400">
                                {new Date(expense.date).toLocaleDateString('es-AR', {
                                  day: '2-digit', month: 'short',
                                })}
                              </span>
                              {cat && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                  style={{ backgroundColor: cat.color + '18', color: cat.color }}>
                                  {cat.name}
                                </span>
                              )}
                              {card && (
                                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-full font-medium border border-violet-100">
                                  <CardIcon />
                                  {card.name}
                                  {card.lastFour && <span className="text-violet-400">···{card.lastFour}</span>}
                                </span>
                              )}
                              {expense.installments && expense.installments > 1 && (
                                <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium border border-amber-100">
                                  {expense.currentInstallment}/{expense.installments} cuotas
                                </span>
                              )}
                              {expense.recurring && (
                                <span className="text-xs px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded-full font-medium border border-sky-100">
                                  Recurrente
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Monto + acciones */}
                          <div className={`shrink-0 text-right ${!selectMode ? 'flex items-center gap-2' : ''}`}>
                            <div>
                              <p className={`text-sm font-semibold font-mono tabular-nums ${isUSD ? 'text-emerald-700' : 'text-slate-800'}`}>
                                {formatMonto(expense)}
                              </p>
                              {isUSD && blue > 0 && (
                                <p className="text-xs text-slate-400 font-mono tabular-nums">
                                  ≈ ${(expense.amount * blue).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                </p>
                              )}
                            </div>
                            {!selectMode && (
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity [li:hover_&]:opacity-100">
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

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {filteredExpenses.length > 0 && (
              <>
                <span className="text-xs text-slate-500">Mostrar</span>
                {[10, 20, 50].map(size => (
                  <button key={size} onClick={() => handlePageSizeChange(size)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      pageSize === size ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {size}
                  </button>
                ))}
              </>
            )}
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {filteredExpenses.length !== monthlyExpenses.length
                ? `${filteredExpenses.length} de ${monthlyExpenses.length} registros`
                : `${monthlyExpenses.length} registro${monthlyExpenses.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors">«</button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="px-3 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors">‹ Ant</button>
              <span className="text-xs font-medium text-slate-700 px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                className="px-3 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors">Sig ›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors">»</button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        entityType="expenses"
        onDeleteAll={() => setBulkDeleting(true)}
        onChangeCategoryAll={handleBulkCategoryChange}
        onChangeCardAll={handleBulkCardChange}
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
