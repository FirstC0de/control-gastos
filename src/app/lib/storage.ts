import { Budget, Expense, Income, Category } from './types';

// Claves para localStorage
const EXPENSES_KEY = 'expenses';
const INCOMES_KEY = 'incomes';
const BUDGETS_KEY = 'budgets';
const CATEGORIES_KEY = 'categories';
const MONTHLY_INCOME_KEY = 'monthlyIncome';

// Funciones para Gastos
export const loadExpenses = (): Expense[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(EXPENSES_KEY);
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

export const saveExpenses = (expenses: Expense[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }
};

// Funciones para Ingresos
export const loadIncomes = (): Income[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(INCOMES_KEY);
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

export const saveIncomes = (incomes: Income[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(INCOMES_KEY, JSON.stringify(incomes));
  }
};

// Funciones para Presupuestos
export const loadBudgets = (): Budget[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(BUDGETS_KEY);
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

export const saveBudgets = (budgets: Budget[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  }
};

// Funciones para Categorías
export const loadCategories = (): Category[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    // Si no hay categorías guardadas, devolver las predeterminadas
    return getDefaultCategories();
  }
  return [];
};

export const saveCategories = (categories: Category[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }
};

// Funciones para Ingreso Mensual
export const loadMonthlyIncome = (): number => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(MONTHLY_INCOME_KEY);
    return saved ? Number(JSON.parse(saved)) : 0;
  }
  return 0;
};

export const saveMonthlyIncome = (amount: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MONTHLY_INCOME_KEY, JSON.stringify(amount));
  }
};

// Categorías predeterminadas
const getDefaultCategories = (): Category[] => [
  {
    id: '1',
    name: 'Comida',
    color: '#4CAF50',
    type: 'expense'
  },
  {
    id: '2',
    name: 'Transporte',
    color: '#2196F3',
    type: 'expense'
  },
  {
    id: '3',
    name: 'Vivienda',
    color: '#FF9800',
    type: 'expense'
  },
  {
    id: '4',
    name: 'Entretenimiento',
    color: '#9C27B0',
    type: 'expense'
  },
  {
    id: '5',
    name: 'Salud',
    color: '#F44336',
    type: 'expense'
  },
  {
    id: '6',
    name: 'Salario',
    color: '#4CAF50',
    type: 'income'
  },
  {
    id: '7',
    name: 'Inversiones',
    color: '#009688',
    type: 'income'
  },
  {
    id: '8',
    name: 'Ventas',
    color: '#795548',
    type: 'income'
  },
  {
    id: '9',
    name: 'Otros Ingresos',
    color: '#607D8B',
    type: 'income'
  },
  {
    id: '10',
    name: 'Otros Gastos',
    color: '#607D8B',
    type: 'expense'
  }
];

// Función para limpiar todos los datos (útil para desarrollo)
export const clearAllFinanceData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(EXPENSES_KEY);
    localStorage.removeItem(INCOMES_KEY);
    localStorage.removeItem(BUDGETS_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(MONTHLY_INCOME_KEY);
  }
};

// Función para inicializar datos de prueba (opcional)
export const initializeSampleData = () => {
  if (typeof window !== 'undefined') {
    if (loadExpenses().length === 0) {
      saveExpenses([]);
    }
    if (loadIncomes().length === 0) {
      saveIncomes([]);
    }
    if (loadBudgets().length === 0) {
      saveBudgets([]);
    }
    if (loadCategories().length === 0) {
      saveCategories(getDefaultCategories());
    }
    if (loadMonthlyIncome() === 0) {
      saveMonthlyIncome(0);
    }
  }
};