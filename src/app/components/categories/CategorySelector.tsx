'use client';

import { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CategoryType } from '../../lib/types';

type CategorySelectorProps = {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  categoryType?: CategoryType;
  required?: boolean;
  includeAllOption?: boolean;
  className?: string;
  disabled?: boolean;
  showManageButton?: boolean;
  // Auto-suggest: if provided, suggests category based on text
  suggestionText?: string;
  onSuggestionAccepted?: () => void;
};

export default function CategorySelector({
  value,
  onChange,
  categoryType = 'expense',
  required = false,
  includeAllOption = false,
  className = '',
  disabled = false,
  suggestionText,
}: CategorySelectorProps) {
  const { getCategoriesByType, suggestCategory } = useFinance();
  const categories = getCategoriesByType(categoryType);
  const selected   = categories.find(c => c.id === value) ?? null;

  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Auto-suggest
  const suggestion = suggestionText && !value
    ? suggestCategory(suggestionText, categoryType)
    : null;
  const suggestedCat = suggestion ? categories.find(c => c.id === suggestion) : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string | null) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className="space-y-1.5">
      {/* Suggestion chip */}
      {suggestedCat && (
        <button
          type="button"
          onClick={() => onChange(suggestion)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <span>{suggestedCat.icon ?? '🏷️'}</span>
          <span>Sugerencia: <strong>{suggestedCat.name}</strong></span>
          <span className="text-indigo-400 ml-0.5">·</span>
          <span className="text-indigo-400">Aceptar</span>
        </button>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) setOpen(v => !v); }}
          className={`flex items-center gap-2 w-full text-left text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'hover:border-slate-400'} ${className}`}
        >
          {selected ? (
            <>
              <span className="text-base leading-none">{selected.icon ?? '🏷️'}</span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selected.color }}
              />
              <span className="flex-1 truncate text-slate-800">{selected.name}</span>
            </>
          ) : (
            <span className="flex-1 text-slate-400">
              {includeAllOption ? 'Todas las categorías' : required ? 'Seleccioná categoría' : 'Sin categoría'}
            </span>
          )}
          <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {/* Search */}
            <div className="px-3 pt-2 pb-1">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="max-h-52 overflow-y-auto py-1">
              {/* No category option */}
              {!required && (
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${!value ? 'bg-slate-50 font-semibold text-slate-700' : 'text-slate-500'}`}
                >
                  <span className="text-base">—</span>
                  <span>{includeAllOption ? 'Todas las categorías' : 'Sin categoría'}</span>
                </button>
              )}

              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 px-3 py-2">Sin resultados</p>
              ) : (
                filtered.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelect(cat.id)}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${cat.id === value ? 'bg-indigo-50' : ''}`}
                  >
                    <span className="text-base leading-none w-5 text-center">{cat.icon ?? '🏷️'}</span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className={`flex-1 truncate ${cat.id === value ? 'font-semibold text-indigo-700' : 'text-slate-700'}`}>
                      {cat.name}
                    </span>
                    {cat.id === value && (
                      <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
