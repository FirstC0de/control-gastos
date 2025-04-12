import { Budget, Expense, Income } from './types';

const EXPENSES_KEY = 'expenses';
const INCOME_KEY = 'monthlyIncome';

export const loadExpenses = (): Expense[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

export const saveExpenses = (expenses: Expense[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }
};

export const loadMonthlyIncome = (): number => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('monthlyIncome');
    return saved ? JSON.parse(saved) : 0;
  }
  return 0;
};



export const saveMonthlyIncome = (amount: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('monthlyIncome', JSON.stringify(amount));
  }
};
// Nuevas funciones para ingresos y presupuestos
export const loadIncomes = (): Income[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('incomes');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

export const saveIncomes = (incomes: Income[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('incomes', JSON.stringify(incomes));
  }
};

export const loadBudgets = (): Budget[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('budgets');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

export const saveBudgets = (budgets: Budget[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }
};