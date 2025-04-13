"use client";
import { useState } from "react";
import { Expense } from "../lib/types";
import { useFinance } from "../context/FinanceContext";
import CategorySelector from "./CategorySelector";

type ExpenseListProps = {
  expenses: Expense[];
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
};

export default function ExpenseList({ expenses, onUpdate, onDelete }: ExpenseListProps) {
  const { categories, getCategoriesByType } = useFinance();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentEdits, setCurrentEdits] = useState<Partial<Expense>>({});
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setCurrentEdits({
      description: expense.description,
      amount: expense.amount,
      categoryId: expense.categoryId
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

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Sin categoría";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Sin categoría";
  };

  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return "#999999";
    const category = categories.find(c => c.id === categoryId);
    return category?.color || "#999999";
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
                      onChange={(e) => handleEditChange('amount', parseFloat(e.target.value) || 0)}
                      className="p-1 border rounded w-24"
                      placeholder="Monto"
                      step="0.01"
                    />
                    <div className="w-32">
                      <CategorySelector
                        value={currentEdits.categoryId || ""}
                        onChange={(categoryId) => handleEditChange('categoryId', categoryId)}
                        categoryType="expense"
                      />
                    </div>
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
                      className="flex items-center px-2 py-1 rounded text-sm"
                      style={{
                        backgroundColor: `${getCategoryColor(expense.categoryId)}20`,
                        color: getCategoryColor(expense.categoryId)
                      }}
                    >
                      <span 
                        className="w-2 h-2 rounded-full mr-2" 
                        style={{ backgroundColor: getCategoryColor(expense.categoryId) }}
                      ></span>
                      {getCategoryName(expense.categoryId)}
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