'use client';

import { useState } from 'react';
import { CategoryType } from '../../lib/types';
import { useFinance } from '../../context/FinanceContext';

interface BulkActionBarProps {
  selectedCount: number;
  entityType: 'expenses' | 'incomes' | 'budgets';
  onDeleteAll: () => void;
  onChangeCategoryAll: (categoryId: string | null) => void;
  onClearSelection: () => void;
}

export default function BulkActionBar({
  selectedCount,
  entityType,
  onDeleteAll,
  onChangeCategoryAll,
  onClearSelection,
}: BulkActionBarProps) {
  const { categories } = useFinance();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const categoryType: CategoryType =
    entityType === 'incomes' ? 'income' : 'expense';

  const filteredCategories = categories.filter(
    c => c.type === categoryType || c.type === 'both'
  );

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
      bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 border border-slate-700
      animate-in fade-in slide-in-from-bottom-4 duration-200">

      {/* Count */}
      <span className="text-sm font-semibold text-slate-300 pr-2 border-r border-slate-700">
        {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
      </span>

      {/* Cambiar categoría */}
      <div className="relative">
        <button
          onClick={() => setShowCategoryPicker(!showCategoryPicker)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
            bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          🏷️ Cambiar categoría
          <span className="text-slate-400">{showCategoryPicker ? '▲' : '▼'}</span>
        </button>

        {showCategoryPicker && (
          <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl
            shadow-xl border border-slate-200 py-1 min-w-50 max-h-60 overflow-y-auto">

            <button
              onClick={() => { onChangeCategoryAll(null); setShowCategoryPicker(false); }}
              className="w-full px-3 py-2 text-left text-sm text-slate-500
                hover:bg-slate-50 flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              Sin categoría
            </button>

            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { onChangeCategoryAll(cat.id); setShowCategoryPicker(false); }}
                className="w-full px-3 py-2 text-left text-sm text-slate-700
                  hover:bg-slate-50 flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }} />
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Eliminar */}
      <button
        onClick={onDeleteAll}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
          bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
      >
        🗑️ Eliminar
      </button>

      {/* Limpiar selección */}
      <button
        onClick={onClearSelection}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700
          rounded-lg transition-colors text-xs"
        title="Cancelar selección"
      >
        ✕
      </button>
    </div>
  );
}