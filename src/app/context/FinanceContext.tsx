'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Expense, Income, Budget, BudgetCategory } from '../lib/types';
import { 
  loadExpenses, 
  saveExpenses, 
  loadIncomes, 
  saveIncomes, 
  loadBudgets, 
  saveBudgets, 
  loadMonthlyIncome, 
} from '../lib/storage';

type FinanceContextType = {
  // Gastos
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  
  // Ingresos
  monthlyIncome: number;
  setMonthlyIncome: (amount: number) => void;
  incomes: Income[];
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  
  // Presupuestos
  budgets: BudgetCategory[];
  addBudget: (budget: Omit<BudgetCategory, 'id'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  setBudgets: (budgets: Budget[]) => void; // Añade esta línea

  // Métodos útiles
  getRemainingBudget: (category: string) => number;
  getCategoryExpenses: (category: string) => Expense[];
  getTotalExpenses: () => number;
  getTotalIncome: () => number;
  getBalance: () => number;

  calculateRemainingBudget: (category: string) => number;
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  // Estados
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0); // Cambiado a setMonthlyIncome

  // Cargar datos iniciales
  useEffect(() => {
    setExpenses(loadExpenses());
    setIncomes(loadIncomes());
    setBudgets(loadBudgets());
    setMonthlyIncome(loadMonthlyIncome());
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => saveExpenses(expenses), [expenses]);
  useEffect(() => saveIncomes(incomes), [incomes]);
  useEffect(() => saveBudgets(budgets), [budgets]);

  // Métodos para Gastos
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    setExpenses(prev => [...prev, newExpense]);
    
    // Actualizar presupuesto si corresponde
    if (expense.category) {
      setBudgets(prev =>
        prev.map(budget =>
          budget.category === expense.category
            ? { ...budget, spent: budget.spent + expense.amount }
            : budget
        )
      );
    }
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev =>
      prev.map(exp => (exp.id === id ? { ...exp, ...updates } : exp))
    );
  };

  const deleteExpense = (id: string) => {
    const expenseToDelete = expenses.find(exp => exp.id === id);
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    
    // Actualizar presupuesto si corresponde
    if (expenseToDelete?.category) {
      setBudgets(prev =>
        prev.map(budget =>
          budget.category === expenseToDelete.category
            ? { ...budget, spent: budget.spent - expenseToDelete.amount }
            : budget
        )
      );
    }
  };

  // Métodos para Ingresos
  const addIncome = (income: Omit<Income, 'id'>) => {
    setIncomes(prev => [...prev, { ...income, id: Date.now().toString() }]);
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
    setBudgets(prev => [...prev, { ...budget, id: Date.now().toString(), spent: 0 }]);
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
  const getRemainingBudget = (category: string) => {
    const budget = budgets.find(b => b.category === category);
    if (!budget) return 0;
    
    const categoryExpenses = expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
      
    return budget.amount - categoryExpenses;
  };

  const getCategoryExpenses = (category: string) => {
    return expenses.filter(e => e.category === category);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getTotalIncome = () => {
    const fixedIncome = monthlyIncome;
    const variableIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    return fixedIncome + variableIncome;
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const calculateRemainingBudget = (category: string) => {
    const budget = budgets.find(b => b.category === category);
    if (!budget) return 0;
    
    const categoryExpenses = expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
      
    return budget.amount - categoryExpenses;
  };

  return (
    <FinanceContext.Provider
      value={{
        // Gastos
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        
        calculateRemainingBudget,
        // Ingresos
        monthlyIncome,
        setMonthlyIncome,
        incomes,
        addIncome,
        updateIncome,
        deleteIncome,
        
        // Presupuestos
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
         setBudgets, // Asegúrate de exponer esta función
         
        // Métodos útiles
        getRemainingBudget,
        getCategoryExpenses,
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