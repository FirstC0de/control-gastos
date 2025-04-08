import { Expense } from "./types";

const EXPENSES_KEY = 'expenses';
const INCOME_KEY = 'income';

export const saveExpenses = (expenses: Expense[]) => {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
};

export const loadExpenses = (): Expense[] => {
  const data = localStorage.getItem(EXPENSES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveMonthlyIncome = (month: string, amount: number) => {
  const incomes = JSON.parse(localStorage.getItem(INCOME_KEY) || '{}');
  incomes[month] = amount;
  localStorage.setItem(INCOME_KEY, JSON.stringify(incomes));
};

export const loadMonthlyIncome = (month: string): number => {
  const incomes = JSON.parse(localStorage.getItem(INCOME_KEY) || '{}');
  return incomes[month] || 0;
};