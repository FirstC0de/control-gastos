"use client"
import { useState } from 'react';
import { Expense } from '../lib/types';

type ExpenseListProps = {
  expenses: Expense[];
  onUpdate: (id: string, updates: Partial<Expense>) => void;
};

const categories = [
  'Comida',
  'Transporte',
  'Entretenimiento',
  'Servicios',
  'Salud',
  'Otros'
];

export default function ExpenseList({ expenses, onUpdate }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentEdits, setCurrentEdits] = useState<Partial<Expense>>({});

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setCurrentEdits({ category: expense.category });
  };

  const saveEditing = (id: string) => {
    onUpdate(id, currentEdits);
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Lista de Gastos</h2>
      {expenses.length === 0 ? (
        <p>No hay gastos registrados</p>
      ) : (
        <ul className="divide-y">
          {expenses.map((expense) => (
            <li key={expense.id} className="py-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()} - ${expense.amount.toFixed(2)}
                  </p>
                </div>
                
                {editingId === expense.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={currentEdits.category || ''}
                      onChange={(e) => setCurrentEdits({ ...currentEdits, category: e.target.value })}
                      className="p-1 border rounded"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => saveEditing(expense.id)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      expense.category ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {expense.category || 'Sin categoría'}
                    </span>
                    <button
                      onClick={() => startEditing(expense)}
                      className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}