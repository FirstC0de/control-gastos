'use client';

import { useFinance } from '../context/FinanceContext';

export default function Dashboard() {
  const { getTotalExpenses, getTotalIncome, getBalance } = useFinance();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm font-medium">Ingresos</h3>
        <p className="text-2xl font-bold text-green-600">${getTotalIncome().toFixed(2)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm font-medium">Gastos</h3>
        <p className="text-2xl font-bold text-red-600">${getTotalExpenses().toFixed(2)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm font-medium">Balance</h3>
        <p className={`text-2xl font-bold ${
          getBalance() >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          ${getBalance().toFixed(2)}
        </p>
      </div>
    </div>
  );
}