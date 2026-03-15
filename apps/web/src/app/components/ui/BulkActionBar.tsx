'use client';

import { useState } from 'react';
import { CategoryType } from '@controlados/shared';
import { useFinance } from '../../context/FinanceContext';

interface BulkActionBarProps {
  selectedCount: number;
  entityType: 'expenses' | 'incomes' | 'budgets';
  onDeleteAll: () => void;
  onChangeCategoryAll: (categoryId: string | null) => void;
  onClearSelection: () => void;
  onChangeCardAll?: (cardId: string | null) => void;
}

export default function BulkActionBar({
  selectedCount,
  entityType,
  onDeleteAll,
  onChangeCategoryAll,
  onClearSelection,
  onChangeCardAll,
}: BulkActionBarProps) {
  const { categories, cards } = useFinance();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);

  const categoryType: CategoryType =
    entityType === 'incomes' ? 'income' : 'expense';

  const filteredCategories = categories.filter(
    c => c.isActive !== false && (c.type === categoryType || c.type === 'both')
  );

  if (selectedCount === 0) return null;

  return (
    // Wrapper: full width on mobile, offset by sidebar on desktop, centers content
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none">
      <div className="max-w-full flex flex-wrap items-center justify-center gap-2 pointer-events-auto
        bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 border border-slate-700
        animate-in fade-in slide-in-from-bottom-4 duration-200 ml-28">

        {/* Count */}
        <span className="text-sm font-semibold text-slate-300 pr-2 border-r border-slate-700 whitespace-nowrap">
          <span className="sm:hidden">{selectedCount} sel.</span>
          <span className="hidden sm:inline">{selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}</span>
        </span>

        {/* Cambiar categoría */}
        <div className="relative">
          <button
            onClick={() => { setShowCategoryPicker(!showCategoryPicker); setShowCardPicker(false); }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
              bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            🏷️ <span className="hidden sm:inline">Categoría</span>
            <span className="text-slate-400 text-[10px]">{showCategoryPicker ? '▲' : '▼'}</span>
          </button>

          {showCategoryPicker && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl
              shadow-xl border border-slate-200 py-1 w-48 max-h-60 overflow-y-auto z-10">
              <button
                onClick={() => { onChangeCategoryAll(null); setShowCategoryPicker(false); }}
                className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
                Sin categoría
              </button>
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { onChangeCategoryAll(cat.id); setShowCategoryPicker(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="text-base leading-none w-5 text-center shrink-0">{cat.icon ?? '🏷️'}</span>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Asignar tarjeta */}
        {entityType === 'expenses' && onChangeCardAll && (
          <div className="relative">
            <button
              onClick={() => { setShowCardPicker(!showCardPicker); setShowCategoryPicker(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
                bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              💳 <span className="hidden sm:inline">Tarjeta</span>
              <span className="text-slate-400 text-[10px]">{showCardPicker ? '▲' : '▼'}</span>
            </button>

            {showCardPicker && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl
                shadow-xl border border-slate-200 py-1 w-48 max-h-60 overflow-y-auto z-10">
                <button
                  onClick={() => { onChangeCardAll(null); setShowCardPicker(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 flex items-center gap-2"
                >
                  <div className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
                  Sin tarjeta
                </button>
                {cards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => { onChangeCardAll(card.id); setShowCardPicker(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                    <span className="truncate">{card.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Eliminar */}
        <button
          onClick={onDeleteAll}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
            bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap"
        >
          🗑️ <span className="hidden sm:inline">Eliminar</span>
        </button>

        {/* Limpiar selección */}
        <button
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          title="Cancelar selección"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
