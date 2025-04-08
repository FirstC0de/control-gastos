"use client"
import { useState } from 'react';
import { Expense } from '../lib/types';

type ExpenseFormProps = {
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
};

export default function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description,
      amount: parseFloat(amount),
      date,
    });
    setDescription('');
    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Agregar Gasto</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-2">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">Monto</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block mb-2">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Agregar Gasto
      </button>
    </form>
  );
}