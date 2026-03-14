'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../lib/types';
import CategoryForm from './CategoryForm';
import ConfirmModal from '../ui/ConfirmModal';
import { ToastContainer, useToast } from '../ui/Toast';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income';
}

type Tab = 'expense' | 'income';
type View = 'list' | 'create' | 'edit';

export default function CategoriesModal({ isOpen, onClose, defaultType = 'expense' }: CategoriesModalProps) {
  const {
    getAllCategories,
    addCategory, updateCategory, deleteCategory,
    hideCategory, restoreCategory,
  } = useFinance();
  const { toasts, show, remove } = useToast();

  const [tab, setTab]                     = useState<Tab>(defaultType === 'income' ? 'income' : 'expense');
  const [view, setView]                   = useState<View>('list');
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [showHidden, setShowHidden]       = useState(false);

  const all = getAllCategories();

  const displayed = useMemo(() => {
    return all
      .filter(c => {
        const matchTab = c.type === tab || c.type === 'both';
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchActive = showHidden ? true : c.isActive !== false;
        return matchTab && matchSearch && matchActive;
      })
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
  }, [all, tab, search, showHidden]);

  const editingCategory = all.find(c => c.id === editingId);
  const deletingCategory = all.find(c => c.id === deletingId);

  const handleCreate = async (data: Omit<Category, 'id'>) => {
    setLoading(true);
    try {
      await addCategory({ ...data, type: tab, isActive: true });
      show(`Categoría "${data.name}" creada`, 'success');
      setView('list');
    } catch {
      show('Error al crear la categoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: Omit<Category, 'id'>) => {
    if (!editingId) return;
    setLoading(true);
    try {
      await updateCategory(editingId, data);
      show(`Categoría "${data.name}" actualizada`, 'success');
      setView('list');
      setEditingId(null);
    } catch {
      show('Error al actualizar la categoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId || !deletingCategory) return;
    setLoading(true);
    try {
      await deleteCategory(deletingId);
      show(`Categoría "${deletingCategory.name}" eliminada`, 'warning');
      setDeletingId(null);
    } catch {
      show('Error al eliminar la categoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (cat: Category) => {
    setLoading(true);
    try {
      await hideCategory(cat.id);
      show(`"${cat.name}" ocultada`, 'warning');
    } catch {
      show('Error al ocultar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (cat: Category) => {
    setLoading(true);
    try {
      await restoreCategory(cat.id);
      show(`"${cat.name}" restaurada`, 'success');
    } catch {
      show('Error al restaurar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setView('edit');
  };

  const handleClose = () => {
    setView('list');
    setSearch('');
    setEditingId(null);
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const hiddenCount = all.filter(c => (c.type === tab || c.type === 'both') && c.isActive === false).length;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              {view !== 'list' && (
                <button
                  onClick={() => { setView('list'); setEditingId(null); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ←
                </button>
              )}
              <h2 className="text-lg font-semibold text-gray-900">
                {view === 'list'   ? 'Categorías' :
                 view === 'create' ? 'Nueva categoría' :
                                    'Editar categoría'}
              </h2>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl transition-colors">
              ✕
            </button>
          </div>

          {/* Tabs — solo en lista */}
          {view === 'list' && (
            <div className="flex border-b px-6">
              {(['expense', 'income'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSearch(''); }}
                  className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === t
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'expense' ? '💸 Gastos' : '💰 Ingresos'}
                </button>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {view === 'list' && (
              <div className="space-y-3">
                {/* Search + toggle hidden */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHidden(v => !v)}
                      className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                        showHidden
                          ? 'border-amber-400 bg-amber-50 text-amber-700'
                          : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {showHidden ? `Ocultar inactivas` : `+${hiddenCount} ocultas`}
                    </button>
                  )}
                </div>

                {/* List */}
                {displayed.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-4xl mb-2">🏷️</p>
                    <p className="text-sm">{search ? 'Sin resultados' : 'Sin categorías todavía'}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {displayed.map(cat => {
                      const isHidden = cat.isActive === false;
                      return (
                        <div
                          key={cat.id}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                            isHidden
                              ? 'border-gray-100 bg-gray-50 opacity-60'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                          style={{ borderLeftColor: isHidden ? '#d1d5db' : cat.color, borderLeftWidth: 4 }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg leading-none w-6 text-center shrink-0">
                              {cat.icon || '🏷️'}
                            </span>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${isHidden ? 'text-gray-400' : 'text-gray-900'}`}>
                                {cat.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {cat.isPredefined && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                    predefinida
                                  </span>
                                )}
                                {isHidden && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">
                                    oculta
                                  </span>
                                )}
                                {cat.type === 'both' && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                                    ambos
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {isHidden ? (
                              /* Restore button */
                              <button
                                onClick={() => handleRestore(cat)}
                                disabled={loading}
                                className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                              >
                                Restaurar
                              </button>
                            ) : (
                              <>
                                {/* Edit — always available */}
                                <button
                                  onClick={() => startEdit(cat)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                {/* Hide (predefined) or Delete (custom) */}
                                {cat.isPredefined ? (
                                  <button
                                    onClick={() => handleHide(cat)}
                                    disabled={loading}
                                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm"
                                    title="Ocultar"
                                  >
                                    👁
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setDeletingId(cat.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {view === 'create' && (
              <CategoryForm
                onSubmit={handleCreate}
                onCancel={() => setView('list')}
                loading={loading}
                initial={{ name: '', color: '#3B82F6', type: tab, icon: '', keywords: [] }}
              />
            )}

            {view === 'edit' && editingCategory && (
              <CategoryForm
                initial={{
                  name:        editingCategory.name,
                  color:       editingCategory.color,
                  type:        editingCategory.type,
                  icon:        editingCategory.icon ?? '',
                  keywords:    editingCategory.keywords ?? [],
                  isPredefined: editingCategory.isPredefined,
                  isActive:    editingCategory.isActive,
                  order:       editingCategory.order,
                  description: editingCategory.description,
                }}
                isPredefined={editingCategory.isPredefined}
                onSubmit={handleUpdate}
                onCancel={() => { setView('list'); setEditingId(null); }}
                loading={loading}
              />
            )}
          </div>

          {/* Footer */}
          {view === 'list' && (
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setView('create')}
                className="w-full py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                + Nueva categoría
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingId}
        title="Eliminar categoría"
        message={`¿Estás seguro de que querés eliminar "${deletingCategory?.name}"? Los gastos e ingresos asociados quedarán sin categoría.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />

      <ToastContainer toasts={toasts} onRemove={remove} />
    </>,
    document.body
  );
}
