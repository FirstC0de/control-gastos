'use client';

import { useRouter } from 'next/navigation';
import { useFinance } from '../context/FinanceContext';
import { useState } from 'react';
import { Income, Budget } from '../lib/types';
import CategorySelector from '../components/CategorySelector';
import { deleteBudget } from '../lib/api';

export default function FinancePage() {
  const {
    incomes,
    addIncome,
    updateIncome,
    deleteIncome,
    budgets,
    addBudget,
    updateBudget,
    expenses,
    categories,
  } = useFinance();

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'incomes' | 'budgets'>('incomes');

  // States para Ingreso
  const [newIncome, setNewIncome] = useState<Omit<Income, 'id'>>({
    name: '',
    amount: 0,
    type: 'monthly',
    date: new Date().toISOString().split('T')[0],
    categoryId: null // Cambiado a null para categoría opcional
  });
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);

  // States para Presupuesto
  const [newBudget, setNewBudget] = useState<Omit<Budget, 'id' | 'spent'>>({
    name: '',
    categoryId: '', // Para presupuestos mantenemos requerida la categoría
    amount: 0,
    period: 'monthly'
  });
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  // Calcular restante
  const calculateRemainingBudget = (categoryId: string) => {
    if (!categoryId) return 0;
    const budget = budgets.find(b => b.categoryId === categoryId);
    if (!budget) return 0;
    const spent = expenses
      .filter(e => e.categoryId === categoryId)
      .reduce((sum, e) => sum + e.amount, 0);
    return budget.amount - spent;
  };

  // Handlers Income
  const handleSubmitIncome = async () => {
    if (!newIncome.name || !newIncome.amount) {
      alert('Nombre y monto son requeridos');
      return;
    }
    
    try {
      if (editingIncomeId) {
        await updateIncome(editingIncomeId, newIncome);
      } else {
        await addIncome(newIncome);
      }
      setNewIncome({ 
        name: '', 
        amount: 0, 
        type: 'monthly', 
        date: new Date().toISOString().split('T')[0], 
        categoryId: null 
      });
      setEditingIncomeId(null);
    } catch (e) {
      console.error('Error al guardar ingreso', e);
      alert('Error al guardar ingreso');
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!confirm('¿Eliminar este ingreso?')) return;
    try {
      await deleteIncome(id);
    } catch (e) {
      console.error('Error al eliminar ingreso', e);
      alert('Error al eliminar ingreso');
    }
  };

  const startEditIncome = (income: Income) => {
    setEditingIncomeId(income.id);
    setNewIncome({
      name: income.name,
      amount: income.amount,
      type: income.type,
      date: income.date,
      categoryId: income.categoryId
    });
  };

  // Handlers Budget
  const handleSubmitBudget = async () => {
    if (!newBudget.name || !newBudget.categoryId || !newBudget.amount) {
      alert('Nombre, categoría y monto son requeridos');
      return;
    }
    
    try {
      if (editingBudgetId) {
        await updateBudget(editingBudgetId, newBudget);
      } else {
        await addBudget(newBudget);
      }
      setNewBudget({ name: '', categoryId: '', amount: 0, period: 'monthly' });
      setEditingBudgetId(null);
    } catch (e) {
      console.error('Error al guardar presupuesto', e);
      alert('Error al guardar presupuesto');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    try {
      await deleteBudget(id);
    } catch (e) {
      console.error('Error al eliminar presupuesto', e);
      alert('Error al eliminar presupuesto');
    }
  };

  const startEditBudget = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setNewBudget({
      name: budget.name,
      categoryId: budget.categoryId,
      amount: budget.amount,
      period: budget.period
    });
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión Financiera</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('incomes')}
          className={`px-4 py-2 font-medium ${activeTab === 'incomes'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Ingresos
        </button>
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-4 py-2 font-medium ${activeTab === 'budgets'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Presupuestos
        </button>
      </div>

      {activeTab === 'incomes' && (
        <section>
          {/* Formulario de Ingresos */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="font-medium mb-3 text-gray-700">
              {editingIncomeId ? 'Editar Ingreso' : 'Agregar Nuevo Ingreso'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                value={newIncome.name}
                onChange={e => setNewIncome({ ...newIncome, name: e.target.value })}
                placeholder="Nombre*"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                value={newIncome.amount || ''}
                onChange={e => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) || 0 })}
                placeholder="Monto*"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
              <select
                value={newIncome.type}
                onChange={e => setNewIncome({ ...newIncome, type: e.target.value as Income['type'] })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Mensual</option>
                <option value="sales">Ventas</option>
                <option value="other">Otros</option>
              </select>
              <input
                type="date"
                value={newIncome.date}
                onChange={e => setNewIncome({ ...newIncome, date: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <CategorySelector
                value={newIncome.categoryId || ''}
                onChange={id => setNewIncome({ ...newIncome, categoryId: id || null })}
                categoryType="income"
                showUncategorizedOption={true}
                className="w-full p-2 border rounded-lg"
              />
              <div className="md:col-span-5 flex justify-end gap-2">
                {editingIncomeId && (
                  <button
                    onClick={() => {
                      setEditingIncomeId(null);
                      setNewIncome({ 
                        name: '', 
                        amount: 0, 
                        type: 'monthly', 
                        date: new Date().toISOString().split('T')[0], 
                        categoryId: null 
                      });
                    }}
                    className="py-2 px-4 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleSubmitIncome}
                  className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingIncomeId ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Tabla de Ingresos */}
          <div className="mb-8 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Lista de Ingresos</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incomes.map(inc => (
                  <tr key={inc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {inc.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${inc.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inc.type === 'monthly' ? 'Mensual' : 
                       inc.type === 'sales' ? 'Ventas' : 'Otros'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(inc.date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {categories.find(c => c.id === inc.categoryId)?.name || 'Sin categoría'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                      <button 
                        onClick={() => startEditIncome(inc)} 
                        className="text-blue-600 hover:text-blue-900"
                        aria-label="Editar ingreso"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteIncome(inc.id)} 
                        className="text-red-600 hover:text-red-900"
                        aria-label="Eliminar ingreso"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'budgets' && (
        <section>
          {/* Formulario de Presupuestos */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="font-medium mb-3 text-gray-700">
              {editingBudgetId ? 'Editar Presupuesto' : 'Agregar Nuevo Presupuesto'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                value={newBudget.name}
                onChange={e => setNewBudget({ ...newBudget, name: e.target.value })}
                placeholder="Nombre*"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                value={newBudget.amount || ''}
                onChange={e => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
                placeholder="Monto*"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
              <CategorySelector
                value={newBudget.categoryId}
                onChange={id => setNewBudget({ ...newBudget, categoryId: id || '' })}
                categoryType="expense"
                showUncategorizedOption={false}
                className="w-full p-2 border rounded-lg"
                required
              />
              <select
                value={newBudget.period}
                onChange={e => setNewBudget({ ...newBudget, period: e.target.value as Budget['period'] })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Mensual</option>
                <option value="weekly">Semanal</option>
                <option value="yearly">Anual</option>
              </select>
              <div className="md:col-span-5 flex justify-end gap-2">
                {editingBudgetId && (
                  <button
                    onClick={() => {
                      setEditingBudgetId(null);
                      setNewBudget({ name: '', categoryId: '', amount: 0, period: 'monthly' });
                    }}
                    className="py-2 px-4 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleSubmitBudget}
                  className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingBudgetId ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Presupuestos */}
          <div className="mb-8 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Lista de Presupuestos</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gastado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.map(budget => {
                  const spent = expenses
                    .filter(e => e.categoryId === budget.categoryId)
                    .reduce((sum, e) => sum + e.amount, 0);
                  const remaining = budget.amount - spent;
                  const category = categories.find(c => c.id === budget.categoryId);
                  
                  return (
                    <tr key={budget.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {budget.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center">
                          {category?.color && (
                            <span 
                              className="w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: category.color }}
                            ></span>
                          )}
                          {category?.name || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${budget.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${spent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        remaining >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${Math.abs(remaining).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        {remaining < 0 && <span className="text-xs ml-1">(excedido)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {budget.period === 'monthly' ? 'Mensual' : 
                         budget.period === 'weekly' ? 'Semanal' : 'Anual'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        <button 
                          onClick={() => startEditBudget(budget)} 
                          className="text-blue-600 hover:text-blue-900"
                          aria-label="Editar presupuesto"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteBudget(budget.id)} 
                          className="text-red-600 hover:text-red-900"
                          aria-label="Eliminar presupuesto"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-6">
        <button
          onClick={() => router.push('/')}
          className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}