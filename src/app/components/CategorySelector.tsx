'use client';

import { useFinance } from '../context/FinanceContext';
import { CategoryType } from '../lib/types';

type CategorySelectorProps = {
  value: string;
  onChange: (categoryId: string) => void;
  categoryType?: CategoryType;
  required?: boolean;
  includeAllOption?: boolean;
  className?: string;
};

export default function CategorySelector({
  value,
  onChange,
  categoryType = 'expense',
  required = false,
  includeAllOption = false,
  className = 'w-full p-2 border rounded'
}: CategorySelectorProps) {
  const { getCategoriesByType } = useFinance();
  const categories = getCategoriesByType(categoryType);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      required={required}
    >
      <option value="">{includeAllOption ? 'Todas las categorías' : 'Seleccionar categoría'}</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id} style={{ color: category.color }}>
          {category.name}
        </option>
      ))}
    </select>
  );
}