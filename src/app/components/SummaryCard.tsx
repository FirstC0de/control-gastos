'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import CategorySelector from './CategorySelector';

export default function SummaryCard() {
  const { 
    expenses,
    monthlyIncome,
    categories,
    budgets,
    getTotalExpenses,
    getTotalIncome,
    getBalance,
    deleteBudget,
    updateBudget
  } = useFinance();

  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetEdits, setBudgetEdits] = useState<{
    name: string;
    amount: number;
    categoryId: string;
  }>({ name: '', amount: 0, categoryId: '' });

  // Calcular gastos por categoría
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = categories.find(c => c.id === expense.categoryId);
    const categoryName = category?.name || 'Sin categoría';
    const categoryColor = category?.color || '#999999';
    
    if (!acc[categoryName]) {
      acc[categoryName] = {
        amount: 0,
        color: categoryColor
      };
    }
    
    acc[categoryName].amount += expense.amount;
    return acc;
  }, {} as Record<string, { amount: number; color: string }>);

  // Calcular presupuestos restantes
  const budgetsWithRemaining = budgets.map(budget => {
    const categoryExpenses = expenses
      .filter(e => e.categoryId === budget.categoryId)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const remaining = budget.amount - categoryExpenses;
    const percentage = (remaining / budget.amount) * 100;

    return {
      ...budget,
      remaining,
      percentage,
      category: categories.find(c => c.id === budget.categoryId)
    };
  });

  const totalExpenses = getTotalExpenses();
  const totalIncome = getTotalIncome();
  const balance = getBalance();
  const percentageUsed = totalIncome > 0 
    ? Math.min(100, (totalExpenses / totalIncome) * 100) 
    : 0;

  // Manejar edición de presupuestos
  const startEditingBudget = (budget: typeof budgets[0]) => {
    setEditingBudgetId(budget.id);
    setBudgetEdits({
      name: budget.name,
      amount: budget.amount,
      categoryId: budget.categoryId
    });
  };

  const saveBudgetEdit = () => {
    if (editingBudgetId) {
      updateBudget(editingBudgetId, {
        name: budgetEdits.name,
        amount: budgetEdits.amount,
        categoryId: budgetEdits.categoryId
      });
      setEditingBudgetId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Resumen Financiero</h2>
      
      {/* Barra de progreso general */}
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Uso de presupuesto</span>
          <span className="text-sm font-medium">{percentageUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              percentageUsed > 80 ? 'bg-red-500' : 
              percentageUsed > 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`} 
            style={{ width: `${percentageUsed}%` }}
          ></div>
        </div>
      </div>

      {/* Sección de Presupuestos */}
      <div className="mb-8">
        <h3 className="font-medium mb-3">Tus Presupuestos</h3>
        <div className="space-y-3">
          {budgetsWithRemaining.map(budget => (
            <div 
              key={budget.id} 
              className="p-3 border rounded-lg"
              style={{ borderLeftColor: budget.category?.color, borderLeftWidth: '4px' }}
            >
              {editingBudgetId === budget.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={budgetEdits.name}
                    onChange={(e) => setBudgetEdits({...budgetEdits, name: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Nombre del presupuesto"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={budgetEdits.amount}
                      onChange={(e) => setBudgetEdits({...budgetEdits, amount: Number(e.target.value)})}
                      className="w-full p-2 border rounded"
                      placeholder="Monto"
                      step="0.01"
                    />
                    <CategorySelector
                      value={budgetEdits.categoryId}
                      onChange={(categoryId) => setBudgetEdits({...budgetEdits, categoryId})}
                      categoryType="expense"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingBudgetId(null)}
                      className="px-3 py-1 bg-gray-200 rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveBudgetEdit}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{budget.name}</h4>
                    <p className="text-sm text-gray-500">
                      {budget.category?.name || 'Sin categoría'} • ${budget.amount.toFixed(2)}
                    </p>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${
                          budget.percentage > 50 ? 'bg-green-500' : 
                          budget.percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(0, budget.percentage)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1">
                      Restante: <span className={`font-medium ${
                        budget.remaining > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${budget.remaining.toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditingBudget(budget)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteBudget(budget.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de Gastos por Categoría */}
      <div className="space-y-4">
        <h3 className="font-medium">Gastos por categoría</h3>
        {Object.entries(expensesByCategory).map(([category, data]) => (
          <div key={category} className="flex justify-between">
            <div className="flex items-center">
              <span 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: data.color }}
              ></span>
              <span>{category}</span>
            </div>
            <div>
              <span className="font-medium">${data.amount.toFixed(2)}</span>
              {totalIncome > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  ({(data.amount / totalIncome * 100).toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between mb-2">
          <span>Total Gastos:</span>
          <span className="font-bold text-red-600">${totalExpenses.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Ingresos:</span>
          <span className="font-bold text-green-600">${totalIncome.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Balance:</span>
          <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${balance.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}