'use client';

import { useState, useEffect } from 'react';
import { Category, CategoryType } from '../../lib/types';

interface CategoryFormProps {
  initial?: Omit<Category, 'id'>;
  onSubmit: (data: Omit<Category, 'id'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isPredefined?: boolean; // limit editable fields for predefined categories
}

const TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'expense', label: '🔴 Gasto' },
  { value: 'income',  label: '🟢 Ingreso' },
  { value: 'both',    label: '🔵 Ambos' },
];

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#0EA5E9', '#10B981', '#F59E0B',
];

const EMOJI_OPTIONS = [
  '🛒','🍽️','🚗','🏠','🏥','📚','🎬','👕','💻','⚡',
  '⚽','🐾','✈️','🛋️','🎁','📦','💼','🖥️','🛍️','🏘️',
  '📈','🎯','💰','💳','🏦','🎮','🎵','🍕','☕','🚀',
  '🌿','💊','🔧','📱','🎓','🏋️','🚴','🧘','🌍','💡',
];

const DEFAULT_FORM: Omit<Category, 'id'> = {
  name: '', color: '#3B82F6', type: 'expense', icon: '', keywords: [],
};

export default function CategoryForm({ initial, onSubmit, onCancel, loading, isPredefined }: CategoryFormProps) {
  const [form, setForm] = useState<Omit<Category, 'id'>>({
    ...DEFAULT_FORM,
    ...initial,
  });
  const [keywordsText, setKeywordsText] = useState(
    (initial?.keywords ?? []).join(', ')
  );

  useEffect(() => {
    setForm({ ...DEFAULT_FORM, ...initial });
    setKeywordsText((initial?.keywords ?? []).join(', '));
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const keywords = keywordsText
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);
    await onSubmit({ ...form, keywords });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Ej: Alimentación, Salario..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
          autoFocus
        />
      </div>

      {/* Ícono */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ícono</label>
        <div className="grid grid-cols-10 gap-1 mb-2 p-2 border border-gray-200 rounded-lg bg-gray-50 max-h-28 overflow-y-auto">
          {EMOJI_OPTIONS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => setForm({ ...form, icon: emoji })}
              className={`w-8 h-8 text-lg rounded-lg flex items-center justify-center transition-all hover:bg-white hover:shadow-sm ${
                form.icon === emoji ? 'bg-white shadow ring-2 ring-indigo-400' : ''
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        {form.icon && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Seleccionado: <span className="text-xl">{form.icon}</span></span>
            <button type="button" onClick={() => setForm({ ...form, icon: '' })} className="text-xs text-gray-400 hover:text-red-500">
              ✕ quitar
            </button>
          </div>
        )}
      </div>

      {/* Tipo — disabled for predefined */}
      {!isPredefined && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, type: opt.value })}
                className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                  form.type === opt.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="grid grid-cols-6 gap-2 mb-2">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color })}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                form.color === color ? 'border-gray-800 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.color}
            onChange={e => setForm({ ...form, color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
          />
          <span className="text-xs text-gray-500">Color personalizado: {form.color}</span>
        </div>
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Palabras clave <span className="text-gray-400 font-normal">(para auto-categorización)</span>
        </label>
        <input
          type="text"
          value={keywordsText}
          onChange={e => setKeywordsText(e.target.value)}
          placeholder="supermercado, coto, jumbo, carrefour..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">Separadas por coma. Se usan para sugerir la categoría automáticamente.</p>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-500">Vista previa:</span>
        <span className="text-base">{form.icon || '🏷️'}</span>
        <span
          className="px-3 py-1 rounded-full text-white text-xs font-medium"
          style={{ backgroundColor: form.color }}
        >
          {form.name || 'Categoría'}
        </span>
        {!isPredefined && (
          <span className="text-xs text-gray-400">
            {TYPE_OPTIONS.find(o => o.value === form.type)?.label}
          </span>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : initial ? 'Actualizar' : 'Crear categoría'}
        </button>
      </div>
    </form>
  );
}
