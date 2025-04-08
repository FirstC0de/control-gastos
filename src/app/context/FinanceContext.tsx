'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Expense } from '../lib/types';
import { loadExpenses, saveExpenses, loadMonthlyIncome, saveMonthlyIncome } from '../lib/storage';

type FinanceContextType = {
  expenses: Expense[];
  monthlyIncome: number;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  setMonthlyIncome: (amount: number) => void;
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyIncome, setIncome] = useState<number>(0);

  // Cargar datos iniciales
  useEffect(() => {
    setExpenses(loadExpenses());
    setIncome(loadMonthlyIncome());
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [
      ...prev,
      { ...expense, id: Date.now().toString() }
    ]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev =>
      prev.map(exp => (exp.id === id ? { ...exp, ...updates } : exp))
    );
  };

  const setMonthlyIncome = (amount: number) => {
    setIncome(amount);
    saveMonthlyIncome(amount);
  };

  return (
    <FinanceContext.Provider
      value={{
        expenses,
        monthlyIncome,
        addExpense,
        updateExpense,
        setMonthlyIncome
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