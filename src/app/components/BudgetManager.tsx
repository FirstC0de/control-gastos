'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '../lib/types';
import CategorySelector from './CategorySelector';

export default function BudgetManager() {
  const {
    categories,
    budgets,
    expenses,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useFinance();

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<Omit<Budget, 'id'>>({
    name: '',
    categoryId: '',
    amount: 0,
    period: 'monthly',
    spent: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.categoryId || !formData.amount) return;

    if (editingBudget) {
      updateBudget(editingBudget.id, formData);
    } else {
      addBudget({
        ...formData,
        spent: 0
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
      amount: 0,
      period: 'monthly',
      spent: 0
    });
    setEditingBudget(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Gestión de Presupuestos</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Nombre del presupuesto</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="Ej. Comida mensual"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Categoría</label>
          <CategorySelector
            value={formData.categoryId}
            onChange={(categoryId) => setFormData({ ...formData, categoryId })}
            categoryType="expense"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Monto</label>
            <input
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
              className="w-full p-2 border rounded"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Periodo</label>
            <select
              value={formData.period}
              onChange={(e) => setFormData({
                ...formData,
                period: e.target.value as Budget['period']
              })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="monthly">Mensual</option>
              <option value="weekly">Semanal</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editingBudget && (
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
            {editingBudget ? 'Actualizar' : 'Crear'} Presupuesto
          </button>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="font-medium mb-3">Tus Presupuestos</h3>
        {budgets.length === 0 ? (
          <p className="text-gray-500">No hay presupuestos creados</p>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const category = categories.find(c => c.id === budget.categoryId);
              const expensesForCategory = expenses.filter(e => e.categoryId === budget.categoryId);
              const totalSpent = expensesForCategory.reduce((sum, e) => sum + e.amount, 0);
              const remaining = budget.amount - totalSpent;
              const percentageUsed = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;

              return (
                <div 
                  key={budget.id} 
                  className="p-3 border rounded-lg"
                  style={{ 
                    borderLeftColor: category?.color, 
                    borderLeftWidth: '4px' 
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{budget.name}</h4>
                      <p className="text-sm text-gray-500">
                        {category?.name || 'Sin categoría'} • ${budget.amount.toFixed(2)} {budget.period === 'monthly' ? '/mes' : budget.period === 'weekly' ? '/sem' : '/personalizado'}
                      </p>
                      
                      {/* Barra de progreso */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            percentageUsed > 80 ? 'bg-red-500' : 
                            percentageUsed > 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, percentageUsed)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-sm mt-1">
                        <span>Gastado: ${totalSpent.toFixed(2)}</span>
                        <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                          Restante: ${Math.abs(remaining).toFixed(2)}
                          {remaining < 0 && ' (excedido)'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingBudget(budget);
                          setFormData({
                            name: budget.name,
                            categoryId: budget.categoryId,
                            amount: budget.amount,
                            period: budget.period,
                            spent: budget.spent || 0
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        aria-label="Editar presupuesto"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el presupuesto "${budget.name}"?`)) {
                            deleteBudget(budget.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        aria-label="Eliminar presupuesto"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}