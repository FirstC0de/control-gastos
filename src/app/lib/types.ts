export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
};

export type Income = {
  id: string;
  amount: number;
  name: string;
  type: 'monthly' | 'sales' | 'other';
  date: string;
  categoryId?: string;
};

export type Budget = {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  spent?: number;
  period: 'monthly' | 'weekly' | 'custom';
};

export type CategoryType = 'expense' | 'income' | 'both';

export type Category = {
  id: string;
  name: string;
  color: string;
  type: CategoryType;
  icon?: string;
};

export type FinanceContextType = {
  // Datos
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  categories: Category[];
  monthlyIncome: number;
  
  // Métodos de categorías
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoriesByType: (type: CategoryType) => Category[];
  
  // Métodos existentes (gastos, ingresos, presupuestos)
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  setMonthlyIncome: (amount: number) => void;
  
  // Métodos útiles
  getRemainingBudget: (categoryId: string) => number;
  getTotalExpenses: () => number;
  getTotalIncome: () => number;
  getBalance: () => number;
};