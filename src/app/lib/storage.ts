import { Expense } from './types';

const EXPENSES_KEY = 'expenses';
const INCOME_KEY = 'monthlyIncome';

export const loadExpenses = (): Expense[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(EXPENSES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveExpenses = (expenses: Expense[]) => {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
};

export const loadMonthlyIncome = (): number => {
  if (typeof window === 'undefined') return 0;
  const income = localStorage.getItem(INCOME_KEY);
  return income ? parseFloat(income) : 0;
};

export const saveMonthlyIncome = (amount: number) => {
  localStorage.setItem(INCOME_KEY, amount.toString());
};