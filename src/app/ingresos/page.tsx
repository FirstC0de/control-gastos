'use client';

import { useRouter } from 'next/navigation';
import { useFinance } from '../context/FinanceContext';
import { useState} from 'react';
import { IncomeType, BudgetCategory } from '../lib/types';

export default function FinancePage() {
  const { 
    incomes, 
    addIncome, 
    deleteIncome,
    budgets,
    addBudget, // Usamos addBudget del contexto
    expenses,
  } = useFinance();
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'incomes' | 'budgets'>('incomes');
  
 // Income form state
 const [newIncome, setNewIncome] = useState<Partial<IncomeType>>({
  name: '',
  amount: 0,
  type: 'monthly',
  date: new Date().toISOString().split('T')[0]
});
  
   // Budget form state
   const [newBudget, setNewBudget] = useState<Omit<BudgetCategory, 'id'>>({
    category: '',
    amount: 0,
    spent: 0
  });

  // Calculate remaining budget
  const calculateRemainingBudget = (category: string) => {
    const budget = budgets.find(b => b.category === category);
    if (!budget) return 0;
    
    const categoryExpenses = expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
      
    return budget.amount - categoryExpenses;
  };

  const handleAddIncome = () => {
    if (!newIncome.name || !newIncome.amount) return;
    
    addIncome({
      id: Date.now().toString(),
      ...newIncome,
      amount: Number(newIncome.amount)
    } as IncomeType);
    
    setNewIncome({
      name: '',
      amount: 0,
      type: 'monthly',
      date: new Date().toISOString().split('T')[0]
    });
  };
  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.amount) return;
    
    addBudget({
      ...newBudget,
      amount: Number(newBudget.amount)
    });
    
    setNewBudget({
      category: '',
      amount: 0,
      spent: 0
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión Financiera</h1>
      
      {/* Navigation Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('incomes')}
          className={`px-4 py-2 font-medium ${activeTab === 'incomes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Ingresos
        </button>
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-4 py-2 font-medium ${activeTab === 'budgets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Presupuestos
        </button>
      </div>
      
      {/* Incomes Tab */}
      {activeTab === 'incomes' && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Registro de Ingresos</h2>
          
          {/* Add Income Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-3 text-gray-700">Agregar Nuevo Ingreso</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newIncome.name}
                  onChange={(e) => setNewIncome({...newIncome, name: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Salario, venta, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="number"
                  value={newIncome.amount || ''}
                  onChange={(e) => setNewIncome({...newIncome, amount: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={newIncome.type}
                  onChange={(e) => setNewIncome({...newIncome, type: e.target.value as any})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Mensual</option>
                  <option value="sales">Ventas</option>
                  <option value="other">Otros</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddIncome}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
          
          {/* Income List */}
          <div>
            <h3 className="font-medium mb-3 text-gray-700">Ingresos Registrados</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incomes.map((income) => (
                    <tr key={income.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{income.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${income.type === 'monthly' ? 'bg-green-100 text-green-800' : 
                            income.type === 'sales' ? 'bg-blue-100 text-blue-800' : 
                            'bg-purple-100 text-purple-800'}`}>
                          {income.type === 'monthly' ? 'Mensual' : 
                           income.type === 'sales' ? 'Ventas' : 'Otros'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${income.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{income.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => deleteIncome(income.id)}
                          className="text-red-600 hover:text-red-900 mr-3"
                        >
                          Eliminar
                        </button>
                        <button 
                          onClick={() => {
                            setNewIncome(income);
                            deleteIncome(income.id);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Gestión de Presupuestos</h2>
          
          {/* Add Budget Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-3 text-gray-700">Crear Nuevo Presupuesto</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  type="text"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Comida, transporte, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="number"
                  value={newBudget.amount || ''}
                  onChange={(e) => setNewBudget({...newBudget, amount: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={handleAddBudget}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Presupuesto
                </button>
              </div>
            </div>
          </div>
          
          {/* Budget List */}
          <div>
            <h3 className="font-medium mb-3 text-gray-700">Presupuestos</h3>
            <div className="space-y-4">
              {budgets.map((budget) => {
                const remaining = calculateRemainingBudget(budget.category);
                const percentage = (remaining / budget.amount) * 100;
                
                return (
                  <div key={budget.category} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-800">{budget.category}</h4>
                      <div className="text-sm">
                        <span className="text-gray-600">Presupuesto: </span>
                        <span className="font-medium">${budget.amount.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full 
                            ${percentage > 50 ? 'bg-green-500' : 
                              percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.max(0, percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-600">Gastado: </span>
                        <span className="font-medium">${(budget.amount - remaining).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Restante: </span>
                        <span className={`font-medium ${
                          remaining > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${remaining.toFixed(2)}
                        </span>
                        {remaining < budget.amount * 0.2 && remaining > 0 && (
                          <span className="ml-2 text-yellow-600">⚠️ Bajo presupuesto</span>
                        )}
                        {remaining <= 0 && (
                          <span className="ml-2 text-red-600">⚠️ Excedido</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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