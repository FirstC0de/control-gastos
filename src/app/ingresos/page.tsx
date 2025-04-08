'use client';

import { useRouter } from 'next/navigation';
import { useFinance } from './../context/FinanceContext';
import { useState, useEffect } from 'react';

export default function IncomePage() {
  const { monthlyIncome, setMonthlyIncome } = useFinance();
  const [inputIncome, setInputIncome] = useState(monthlyIncome);
  const router = useRouter();

  useEffect(() => {
    setInputIncome(monthlyIncome);
  }, [monthlyIncome]);

  const handleSave = () => {
    setMonthlyIncome(inputIncome);
    router.push('/');
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Configurar Ingresos</h1>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">Ingreso mensual:</label>
        <input
          type="number"
          value={inputIncome}
          onChange={(e) => setInputIncome(parseFloat(e.target.value) || 0)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          step="0.01"
          min="0"
        />
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => router.push('/')}
          className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}