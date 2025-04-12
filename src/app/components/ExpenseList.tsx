"use client";
import { useState } from "react";
import { Expense } from "../lib/types";

type ExpenseListProps = {
  expenses: Expense[];
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
};

const categories = [
  "Comida",
  "Transporte",
  "Entretenimiento",
  "Servicios",
  "Salud",
  "Otros",
];

export default function ExpenseList({ expenses, onUpdate, onDelete }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentEdits, setCurrentEdits] = useState<Partial<Expense>>({});
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setCurrentEdits({
      description: expense.description,
      amount: expense.amount,
      category: expense.category
    });
  };

  const startNameEditing = (expense: Expense) => {
    setEditingNameId(expense.id);
    setEditedName(expense.description);
  };

  const saveNameEdit = (id: string) => {
    onUpdate(id, { description: editedName });
    setEditingNameId(null);
  };

  const deleteExpense = (expense: Expense) => {
    onDelete(expense.id);
  };

  const handleEditChange = (field: keyof Expense, value: string | number) => {
    setCurrentEdits(prev => ({
      ...prev,
      [field]: value
    }));
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
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {editingNameId === expense.id ? (
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onBlur={() => saveNameEdit(expense.id)}
                        onKeyPress={(e) => e.key === 'Enter' && saveNameEdit(expense.id)}
                        autoFocus
                        className="font-medium border-b-2 border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <>
                        <p className="font-medium">{expense.description}</p>
                        <button
                          onClick={() => startNameEditing(expense)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()} - $
                    {expense.amount.toFixed(2)}
                  </p>
                </div>

                {editingId === expense.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={currentEdits.amount || ""}
                      onChange={(e) => handleEditChange('amount', parseFloat(e.target.value))}
                      className="p-1 border rounded w-24"
                      placeholder="Monto"
                      step="0.01"
                    />
                    <select
                      value={currentEdits.category || ""}
                      onChange={(e) => handleEditChange('category', e.target.value)}
                      className="p-1 border rounded"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
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
                    <span
                      className={`px-2 py-1 rounded text-sm ${expense.category
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {expense.category || "Sin categoría"}
                    </span>
                    <button
                      onClick={() => startEditing(expense)}
                      className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteExpense(expense)}
                      className="px-2 py-1 bg-red-800 text-white rounded text-sm hover:bg-red-900"
                    >
                      Eliminar
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