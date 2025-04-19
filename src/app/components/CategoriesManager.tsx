'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Category } from '../lib/types';

export default function CategoriesManager() {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory
  } = useFinance();
  
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    color: '#4CAF50',
    type: 'expense'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.color) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory, formData);
      } else {
        await addCategory(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#4CAF50',
      type: 'expense'
    });
    setEditingCategory(null);
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category.id);
    setFormData({
      name: category.name,
      color: category.color,
      type: category.type
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta categoría?')) {
      try {
        await deleteCategory(id);
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Gestión de Categorías</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Nombre</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Color</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({
                ...formData, 
                type: e.target.value as 'expense' | 'income' | 'both'
              })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
              <option value="both">Ambos</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          {editingCategory && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {editingCategory ? 'Actualizar' : 'Crear'} Categoría
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <h3 className="font-medium mb-3">Tus Categorías</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="p-3 border rounded-lg flex justify-between items-center"
              style={{ 
                borderLeftColor: category.color, 
                borderLeftWidth: '4px' 
              }}
            >
              <div>
                <h4 className="font-medium">{category.name}</h4>
                <p className="text-sm text-gray-500">
                  {category.type === 'expense' ? 'Gasto' : 
                   category.type === 'income' ? 'Ingreso' : 'Ambos'} • {category.color}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(category)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
