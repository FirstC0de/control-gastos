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
    categoryId: string | null;
  }>({ name: '', amount: 0, categoryId: null });

  // Calcular gastos por categoría
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = categories.find(c => c.id === expense.categoryId);
    const name = category?.name || 'Sin categoría';
    const color = category?.color || '#999999';

    if (!acc[name]) acc[name] = { amount: 0, color };
    acc[name].amount += expense.amount;
    return acc;
  }, {} as Record<string, { amount: number; color: string }>);

  // Calcular presupuestos restantes
  const budgetsWithRemaining = budgets.map(budget => {
    const spent = expenses
      .filter(e => e.categoryId === budget.categoryId)
      .reduce((sum, e) => sum + e.amount, 0);

    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (remaining / budget.amount) * 100 : 0;
    const category = categories.find(c => c.id === budget.categoryId);

    return { ...budget, remaining, percentage, category };
  });

  const totalExpenses = getTotalExpenses();
  const totalIncome = getTotalIncome();
  const balance = getBalance();
  const usage = totalIncome > 0 ? Math.min(100, (totalExpenses / totalIncome) * 100) : 0;

  // Edición de presupuesto
  const startEditing = (b: typeof budgetsWithRemaining[0]) => {
    setEditingBudgetId(b.id);
    setBudgetEdits({ 
      name: b.name, 
      amount: b.amount, 
      categoryId: b.categoryId 
    });
  };

  const saveEdit = async () => {
    if (!editingBudgetId) return;
    try {
      await updateBudget(editingBudgetId, {
        name: budgetEdits.name,
        amount: budgetEdits.amount,
        categoryId: budgetEdits.categoryId
      });
      setEditingBudgetId(null);
    } catch (e) {
      console.error('Error al actualizar presupuesto', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este presupuesto?')) {
      try {
        await deleteBudget(id);
      } catch (e) {
        console.error('Error al eliminar presupuesto', e);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Resumen Financiero</h2>
      
      {/* Progreso general */}
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Uso total</span>
          <span className="text-sm font-medium">{usage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              usage > 80 ? 'bg-red-500' : usage > 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${usage}%` }}
          ></div>
        </div>
      </div>

      {/* Presupuestos */}
      <div className="mb-8">
        <h3 className="font-medium mb-3">Tus Presupuestos</h3>
        <div className="space-y-3">
          {budgetsWithRemaining.map(b => (
            <div
              key={b.id}
              className="p-3 border rounded-lg"
              style={{ borderLeftColor: b.category?.color, borderLeftWidth: '4px' }}
            >
              {editingBudgetId === b.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full p-2 border rounded"
                    value={budgetEdits.name}
                    onChange={e => setBudgetEdits(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      className="p-2 border rounded"
                      value={budgetEdits.amount}
                      onChange={e => setBudgetEdits(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      placeholder="Monto"
                      min="0"
                      step="0.01"
                    />
                    <CategorySelector
                      value={budgetEdits.categoryId}
                      onChange={(id) => setBudgetEdits(prev => ({ ...prev, categoryId: id }))}
                      categoryType="expense"
                      showUncategorizedOption={false}
                      className="p-2 border rounded text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingBudgetId(null)}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{b.name}</h4>
                    <p className="text-sm text-gray-500">
                      {b.category?.name || 'Sin categoría'} • ${b.amount.toFixed(2)}
                    </p>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          b.percentage > 50 ? 'bg-green-500' : b.percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(0, b.percentage)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1">
                      Restante: <span className={`font-medium ${b.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${b.remaining.toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(b)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
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

      {/* Gastos por categoría */}
      <div className="space-y-2">
        <h3 className="font-medium">Gastos por categoría</h3>
        {Object.entries(expensesByCategory).map(([name, data]) => (
          <div key={name} className="flex justify-between">
            <div className="flex items-center">
              <span
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: data.color }}
              ></span>
              <span>{name}</span>
            </div>
            <span className="font-medium">
              ${data.amount.toFixed(2)}
              {totalIncome > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  ({(data.amount / totalIncome * 100).toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between">
          <span>Total Gastos:</span>
          <span className="font-bold text-red-600">${totalExpenses.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
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