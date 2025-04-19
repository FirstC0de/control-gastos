'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import {
  fetchExpenses,
  createExpense as apiCreateExpense,
  deleteExpense as apiDeleteExpense,
  fetchIncomes,
  createIncome as apiCreateIncome,
  deleteIncome as apiDeleteIncome,
  fetchBudgets,
  createBudget as apiCreateBudget,
  deleteBudget as apiDeleteBudget,
  fetchCategories,
  createCategory as apiCreateCategory,
  deleteCategory as apiDeleteCategory,
  fetchMonthlyIncome,
  updateMonthlyIncome as apiUpdateMonthlyIncome
} from '../lib/api';
import {
  Expense,
  Income,
  Budget,
  Category,
  CategoryType,
  FinanceContextType
} from '../lib/types';

const BASE = process.env.NEXT_PUBLIC_API_URL as string;

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);

  useEffect(() => {
    fetchExpenses().then(setExpenses).catch(console.error);
    fetchIncomes().then(setIncomes).catch(console.error);
    fetchBudgets().then(setBudgets).catch(console.error);
    fetchCategories().then(setCategories).catch(console.error);
    fetchMonthlyIncome().then(setMonthlyIncome).catch(console.error);
  }, []);

  // --- GASTOS ---
  const addExpense = async (e: Omit<Expense, 'id'>) => {
    const newExp = await apiCreateExpense(e);
    setExpenses(prev => [...prev, newExp]);
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const res = await fetch(`${BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Error al actualizar gasto');
    const updated = await res.json();
    setExpenses(prev => prev.map(x => x.id === id ? updated : x));
  };

  const deleteExpense = async (id: string) => {
    await apiDeleteExpense(id);
    setExpenses(prev => prev.filter(x => x.id !== id));
  };

  // --- INGRESOS ---
  const addIncome = async (i: Omit<Income, 'id'>) => {
    const newInc = await apiCreateIncome(i);
    setIncomes(prev => [...prev, newInc]);
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    const res = await fetch(`${BASE}/incomes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Error al actualizar ingreso');
    const updated = await res.json();
    setIncomes(prev => prev.map(x => x.id === id ? updated : x));
  };

  const deleteIncome = async (id: string) => {
    await apiDeleteIncome(id);
    setIncomes(prev => prev.filter(x => x.id !== id));
  };

  // --- PRESUPUESTOS ---
  const addBudget = async (b: Omit<Budget, 'id'>) => {
    const newBud = await apiCreateBudget(b);
    setBudgets(prev => [...prev, newBud]);
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const res = await fetch(`${BASE}/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Error al actualizar presupuesto');
    const updated = await res.json();
    setBudgets(prev => prev.map(x => x.id === id ? updated : x));
  };

  const deleteBudget = async (id: string) => {
    await apiDeleteBudget(id);
    setBudgets(prev => prev.filter(x => x.id !== id));
  };

  // --- CATEGORÍAS ---
  const addCategory = async (c: Omit<Category, 'id'>) => {
    const newCat = await apiCreateCategory(c);
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    // TODO: PUT /api/categories/:id
    setCategories(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x));
  };

  const deleteCategory = async (id: string) => {
    await apiDeleteCategory(id);
    setCategories(prev => prev.filter(x => x.id !== id));
  };

  // --- INGRESO MENSUAL ---
  const setMonthly = async (amt: number) => {
    const updatedAmt = await apiUpdateMonthlyIncome(amt);
    setMonthlyIncome(updatedAmt);
  };

  // --- MÉTODOS ÚTILES ---
  const getCategoriesByType = (type: CategoryType) =>
    categories.filter(c => c.type === 'both' || c.type === type);

  const getRemainingBudget = (categoryId: string) => {
    const budget = budgets.find(b => b.categoryId === categoryId);
    if (!budget) return 0;
    const spent = expenses
      .filter(e => e.categoryId === categoryId)
      .reduce((sum, e) => sum + e.amount, 0);
    return budget.amount - spent;
  };

  const getTotalExpenses = () =>
    expenses.reduce((sum, e) => sum + e.amount, 0);

  const getTotalIncome = () =>
    monthlyIncome + incomes.reduce((sum, i) => sum + i.amount, 0);

  const getBalance = () =>
    getTotalIncome() - getTotalExpenses();

  return (
    <FinanceContext.Provider
      value={{
        expenses,
        incomes,
        budgets,
        categories,
        monthlyIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        addIncome,
        updateIncome,
        deleteIncome,
        addBudget,
        updateBudget,
        deleteBudget,
        addCategory,
        updateCategory,
        deleteCategory,
        setMonthlyIncome: setMonthly,
        getCategoriesByType,
        getRemainingBudget,
        getTotalExpenses,
        getTotalIncome,
        getBalance
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};