'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  Expense, 
  Income, 
  Budget, 
  Category, 
  CategoryType,
  FinanceContextType 
} from '../lib/types';
import { 
  loadExpenses, saveExpenses, 
  loadIncomes, saveIncomes, 
  loadBudgets, saveBudgets, 
  loadMonthlyIncome, saveMonthlyIncome,
  loadCategories, saveCategories
} from '../lib/storage';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  // Estados
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyIncome, setMonthlyIncomeState] = useState<number>(0);

  // Cargar datos iniciales
  useEffect(() => {
    setExpenses(loadExpenses());
    setIncomes(loadIncomes());
    setBudgets(loadBudgets());
    setMonthlyIncomeState(loadMonthlyIncome());
    const loadedCategories = loadCategories();
    setCategories(loadedCategories.length > 0 ? loadedCategories : getDefaultCategories());
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => saveExpenses(expenses), [expenses]);
  useEffect(() => saveIncomes(incomes), [incomes]);
  useEffect(() => saveBudgets(budgets), [budgets]);
  useEffect(() => saveCategories(categories), [categories]);

  // Categorías por defecto
  const getDefaultCategories = (): Category[] => [
    { id: '1', name: 'Comida', color: '#4CAF50', type: 'expense' },
    { id: '2', name: 'Transporte', color: '#2196F3', type: 'expense' },
    { id: '3', name: 'Entretenimiento', color: '#9C27B0', type: 'expense' },
    { id: '4', name: 'Vivienda', color: '#FF9800', type: 'expense' },
    { id: '5', name: 'Salario', color: '#4CAF50', type: 'income' },
    { id: '6', name: 'Inversiones', color: '#009688', type: 'income' },
    { id: '7', name: 'Ventas', color: '#795548', type: 'income' },
    { id: '8', name: 'Otros', color: '#607D8B', type: 'both' },
  ];

  // Métodos de categorías
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: Date.now().toString() };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategory = (id: string) => {
    const isUsed = expenses.some(e => e.categoryId === id) || 
                  incomes.some(i => i.categoryId === id) ||
                  budgets.some(b => b.categoryId === id);
    
    if (!isUsed) {
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } else {
      alert('No se puede eliminar una categoría en uso');
    }
  };

  const getCategoriesByType = (type: CategoryType) => {
    return categories.filter(cat => 
      cat.type === 'both' || cat.type === type
    );
  };

  // Métodos para Gastos
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    setExpenses(prev => [...prev, newExpense]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev =>
      prev.map(exp => (exp.id === id ? { ...exp, ...updates } : exp))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  // Métodos para Ingresos
  const addIncome = (income: Omit<Income, 'id'>) => {
    const newIncome = { ...income, id: Date.now().toString() };
    setIncomes(prev => [...prev, newIncome]);
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    setIncomes(prev =>
      prev.map(inc => (inc.id === id ? { ...inc, ...updates } : inc))
    );
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(inc => inc.id !== id));
  };

  // Métodos para Presupuestos
  const addBudget = (budget: Omit<Budget, 'id'>) => {
    const newBudget = { ...budget, id: Date.now().toString(), spent: budget.spent || 0 };
    setBudgets(prev => [...prev, newBudget]);
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets(prev =>
      prev.map(budget => (budget.id === id ? { ...budget, ...updates } : budget))
    );
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  // Métodos útiles
  const getRemainingBudget = (categoryId: string) => {
    const budget = budgets.find(b => b.categoryId === categoryId);
    if (!budget) return 0;
    
    const categoryExpenses = expenses
      .filter(e => e.categoryId === categoryId)
      .reduce((sum, e) => sum + e.amount, 0);
      
    return budget.amount - categoryExpenses;
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getTotalIncome = () => {
    return monthlyIncome + incomes.reduce((sum, i) => sum + i.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const setMonthlyIncome = (amount: number) => {
    setMonthlyIncomeState(amount);
    saveMonthlyIncome(amount);
  };

  return (
    <FinanceContext.Provider
      value={{
        // Datos
        expenses,
        incomes,
        budgets,
        categories,
        monthlyIncome,
        
        // Categorías
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoriesByType,
        
        // Gastos
        addExpense,
        updateExpense,
        deleteExpense,
        
        // Ingresos
        addIncome,
        updateIncome,
        deleteIncome,
        
        // Presupuestos
        addBudget,
        updateBudget,
        deleteBudget,
        setMonthlyIncome,
        
        // Métodos útiles
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
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};