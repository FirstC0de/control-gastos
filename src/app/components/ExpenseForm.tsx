"use client";
import { useState } from 'react';
import { Expense } from '../lib/types';
import { useFinance } from '../context/FinanceContext';
import CategorySelector from './CategorySelector';

type ExpenseFormProps = {
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
};

export default function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const { getCategoriesByType } = useFinance();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || !date) return;
    
    onSubmit({
      description,
      amount: parseFloat(amount),
      date,
      categoryId
    });
    
    // Reset form
    setDescription('');
    setAmount('');
    setCategoryId('');
    setDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Agregar Gasto</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="¿En qué gastaste?"
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Monto</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Categoría</label>
          <CategorySelector
            value={categoryId}
            onChange={setCategoryId}
            categoryType="expense"
            includeAllOption={false}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Agregar Gasto
        </button>
      </div>
    </form>
  );
}