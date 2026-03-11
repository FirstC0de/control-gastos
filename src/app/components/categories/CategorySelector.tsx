'use client';

import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CategoryType } from '../../lib/types';
import CategoriesModal from './CategoriesModal';

type CategorySelectorProps = {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  categoryType?: CategoryType;
  required?: boolean;
  includeAllOption?: boolean;
  className?: string;
  disabled?: boolean;
  showManageButton?: boolean; // Mostrar botón para gestionar categorías
};

export default function CategorySelector({
  value,
  onChange,
  categoryType = 'expense',
  required = false,
  includeAllOption = false,
  className = 'w-full p-2 border border-gray-300 rounded-lg text-sm',
  disabled = false,
  showManageButton = true,
}: CategorySelectorProps) {
  const { getCategoriesByType } = useFinance();
  const categories = getCategoriesByType(categoryType);
  const [modalOpen, setModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    onChange(v === '' ? null : v);
  };

  return (
    <>
      <div className="flex gap-2 items-center">
        <select
          value={value || ''}
          onChange={handleChange}
          className={`${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} flex-1`}
          required={required}
          disabled={disabled}
        >
          <option value="">
            {includeAllOption ? 'Todas las categorías' : required ? 'Seleccionar categoría' : 'Sin categoría'}
          </option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {showManageButton && !disabled && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="Gestionar categorías"
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-gray-300 transition-colors text-sm"
          >
            🏷️
          </button>
        )}
      </div>

      <CategoriesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={categoryType}
      />
    </>
  );
}

