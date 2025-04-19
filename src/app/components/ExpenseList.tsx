'use client';

import { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { Expense } from "../lib/types";
import CategorySelector from "./CategorySelector";

export default function ExpenseList() {
  const { expenses, updateExpense, deleteExpense, categories } = useFinance();
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

  const saveNameEdit = async (id: string) => {
    try {
      await updateExpense(id, { description: editedName });
      setEditingNameId(null);
    } catch (error) {
      console.error('Error al actualizar descripción:', error);
    }
  };

  const saveEditing = async (id: string) => {
    try {
      await updateExpense(id, currentEdits);
      setEditingId(null);
    } catch (error) {
      console.error('Error al guardar cambios:', error);
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (confirm(`¿Eliminar el gasto "${expense.description}"?`)) {
      try {
        await deleteExpense(expense.id);
      } catch (error) {
        console.error('Error al eliminar gasto:', error);
      }
    }
  };

  const handleEditChange = (field: keyof Expense, value: string | number | null) => {
    setCurrentEdits(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId) return 'Sin categoría';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Sin categoría';
  };

  const getCategoryColor = (categoryId?: string | null) => {
    if (!categoryId) return '#999999';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.color || '#999999';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Lista de Gastos</h2>
      {expenses.length === 0 ? (
        <p className="text-gray-500">No hay gastos registrados</p>
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
                          aria-label="Editar nombre"
                        >
                          ✏️
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      value={currentEdits.amount || ""}
                      onChange={(e) => handleEditChange('amount', parseFloat(e.target.value) || 0)}
                      className="p-1 border rounded w-24"
                      placeholder="Monto"
                      step="0.01"
                      min="0"
                    />
                    <div className="w-40 min-w-[160px]">
                      <CategorySelector
                        value={currentEdits.categoryId || null}
                        onChange={(catId) => handleEditChange('categoryId', catId)}
                        categoryType="expense"
                        showUncategorizedOption={true}
                        className="p-1 border rounded text-sm"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveEditing(expense.id)}
                        className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
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
                      aria-label="Editar gasto"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(expense)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      aria-label="Eliminar gasto"
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