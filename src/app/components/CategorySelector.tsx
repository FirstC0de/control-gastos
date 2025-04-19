'use client';

import { useFinance } from '../context/FinanceContext';
import { CategoryType } from '../lib/types';

type CategorySelectorProps = {
  value: string | null; // Ahora acepta null para categoría no seleccionada
  onChange: (categoryId: string | null) => void; // Puede devolver null
  categoryType?: CategoryType;
  required?: boolean;
  includeAllOption?: boolean;
  showUncategorizedOption?: boolean; // Nueva prop para opción "Sin categoría"
  className?: string;
  disabled?: boolean;
};

export default function CategorySelector({
  value,
  onChange,
  categoryType = 'expense',
  required = false,
  includeAllOption = false,
  showUncategorizedOption = true, // Mostrar opción "Sin categoría" por defecto
  className = 'w-full p-2 border rounded',
  disabled = false
}: CategorySelectorProps) {
  const { getCategoriesByType } = useFinance();
  const categories = getCategoriesByType(categoryType);

  // Maneja el cambio de selección
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === '' ? null : selectedValue);
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      className={`${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      required={required}
      disabled={disabled}
    >
      {/* Opción para "Todas las categorías" o selección por defecto */}
      {includeAllOption ? (
        <option value="">Todas las categorías</option>
      ) : (
        <option value="">{required ? 'Seleccione una categoría' : 'Sin categoría'}</option>
      )}

      {/* Opción explícita para "Sin categoría" cuando no es required */}
      {!required && showUncategorizedOption && !includeAllOption && (
        <option value="">Sin categoría</option>
      )}

      {/* Mapeo de categorías disponibles */}
      {categories.map((category) => (
        <option 
          key={category.id} 
          value={category.id} 
          style={{ color: category.color }}
          className="flex items-center"
        >
          {category.icon && (
            <span className="mr-2" dangerouslySetInnerHTML={{ __html: category.icon }} />
          )}
          {category.name}
        </option>
      ))}
    </select>
  );
}