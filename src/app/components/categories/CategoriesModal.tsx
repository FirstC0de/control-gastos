'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { Category, CategoryType } from '../../lib/types';
import CategoryForm from './CategoryForm';
import ConfirmModal from '../ui/ConfirmModal';
import { ToastContainer, useToast } from '../ui/Toast';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: CategoryType;
}

type View = 'list' | 'create' | 'edit';

const TYPE_LABELS: Record<string, string> = {
  expense: 'Gasto',
  income:  'Ingreso',
  both:    'Ambos',
};

const TYPE_COLORS: Record<string, string> = {
  expense: 'bg-red-100 text-red-700',
  income:  'bg-green-100 text-green-700',
  both:    'bg-blue-100 text-blue-700',
};

export default function CategoriesModal({ isOpen, onClose, defaultType = 'expense' }: CategoriesModalProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const { toasts, show, remove } = useToast();

  const [view, setView]                   = useState<View>('list');
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState('');
  const [filterType, setFilterType]       = useState<CategoryType | 'all'>('all');

  const editingCategory = categories.find(c => c.id === editingId);
  const deletingCategory = categories.find(c => c.id === deletingId);

  // Filtrado con búsqueda + tipo
  const filtered = useMemo(() => {
    return categories.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchType   = filterType === 'all' || c.type === filterType || c.type === 'both';
      return matchSearch && matchType;
    });
  }, [categories, search, filterType]);

  const handleCreate = async (data: Omit<Category, 'id'>) => {
    setLoading(true);
    try {
      await addCategory(data);
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
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {view === 'list' && (
              <div className="space-y-4">
                {/* Búsqueda y filtros */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar categoría..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as CategoryType | 'all')}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Todos</option>
                    <option value="expense">Gastos</option>
                    <option value="income">Ingresos</option>
                    <option value="both">Ambos</option>
                  </select>
                </div>

                {/* Lista */}
                {filtered.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-4xl mb-2">🏷️</p>
                    <p className="text-sm">
                      {search ? 'No se encontraron categorías' : 'No hay categorías todavía'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map(cat => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                        style={{ borderLeftColor: cat.color, borderLeftWidth: 4 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[cat.type]}`}>
                              {TYPE_LABELS[cat.type]}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeletingId(cat.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === 'create' && (
              <CategoryForm
                onSubmit={handleCreate}
                onCancel={() => setView('list')}
                loading={loading}
              />
            )}

            {view === 'edit' && editingCategory && (
              <CategoryForm
                initial={{
                  name:  editingCategory.name,
                  color: editingCategory.color,
                  type:  editingCategory.type,
                }}
                onSubmit={handleUpdate}
                onCancel={() => { setView('list'); setEditingId(null); }}
                loading={loading}
              />
            )}
          </div>

          {/* Footer — solo en vista lista */}
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

      {/* Modal de confirmación de eliminación */}
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