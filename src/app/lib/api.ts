// src/lib/api.ts
import {
  Budget,
  Expense,
  Income,
  Category
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL;

// —————— EXPENSES ——————
export async function fetchExpenses(): Promise<Expense[]> {
  const res = await fetch(`${BASE}/expenses`);
  if (!res.ok) throw new Error('Error al obtener gastos');
  return res.json();
}

export async function createExpense(e: Omit<Expense, 'id'>): Promise<Expense> {
  const res = await fetch(`${BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(e),
  });
  if (!res.ok) throw new Error('Error al crear gasto');
  return res.json();
}

export async function deleteExpense(id: Expense['id']): Promise<void> {
  const res = await fetch(`${BASE}/expenses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al borrar gasto');
}

// —————— INCOMES ——————
export async function fetchIncomes(): Promise<Income[]> {
  const res = await fetch(`${BASE}/incomes`);
  if (!res.ok) throw new Error('Error al obtener ingresos');
  return res.json();
}

export async function createIncome(i: Omit<Income, 'id'>): Promise<Income> {
  const res = await fetch(`${BASE}/incomes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(i),
  });
  if (!res.ok) throw new Error('Error al crear ingreso');
  return res.json();
}

export async function deleteIncome(id: Income['id']): Promise<void> {
  const res = await fetch(`${BASE}/incomes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al borrar ingreso');
}

// —————— BUDGETS ——————
export async function fetchBudgets(): Promise<Budget[]> {
  const res = await fetch(`${BASE}/budgets`);
  if (!res.ok) throw new Error('Error al obtener presupuestos');
  return res.json();
}

export async function createBudget(b: Omit<Budget, 'id'>): Promise<Budget> {
  const res = await fetch(`${BASE}/budgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b),
  });
  if (!res.ok) throw new Error('Error al crear presupuesto');
  return res.json();
}

export async function deleteBudget(id: Budget['id']): Promise<void> {
  const res = await fetch(`${BASE}/budgets/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al borrar presupuesto');
}

// —————— CATEGORIES ——————
export function fetchCategories() {
  return fetch(`${BASE}/categories`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
}

// Now accepts Omit<Category,'id'> as input
export async function createCategory(c: Omit<Category, 'id'>): Promise<Category> {
  const res = await fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json'  },
    body: JSON.stringify(c),
  });
  if (!res.ok) throw new Error('Error al crear categoría');
  return res.json();
}

export async function deleteCategory(id: Category['id']): Promise<void> {
  const res = await fetch(`${BASE}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al borrar categoría');
}

// —————— MONTHLY INCOME ——————
export async function fetchMonthlyIncome(): Promise<number> {
  const res = await fetch(`${BASE}/monthly-income`);
  if (!res.ok) throw new Error('Error al obtener ingreso mensual');
  const data = await res.json(); // { id: 1, amount: number }
  return data.amount;
}

export async function updateMonthlyIncome(amount: number): Promise<number> {
  const res = await fetch(`${BASE}/monthly-income`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error('Error al actualizar ingreso mensual');
  const data = await res.json();
  return data.amount;
}
