export type Currency = 'ARS' | 'USD';

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId?: string | null;
  cardId?: string | null;
  installments?: number;
  currentInstallment?: number;
  installmentAmount?: number;
  currency?: Currency; // ← nuevo, opcional para no romper gastos existentes
};

export type Card = {
  id: string;
  name: string;        // "Visa Galicia", "Mastercard HSBC"
  lastFour?: string;   // últimos 4 dígitos
  color: string;       // color identificador
  closingDay: number;  // día de cierre (ej: 15)
  dueDay: number;      // día de vencimiento (ej: 5)
};

export type Income = {
  id: string;
  amount: number;
  name: string;
  type: 'monthly' | 'sales' | 'other';
  date: string;
  categoryId?: string | null;
  currency?: Currency; // ← nuevo
};

export type Budget = {
  id: string;
  name: string;
  categoryId?: string | null;
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

  // Categorías
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoriesByType: (type: CategoryType) => Category[];

  // Gastos
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Ingresos
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  // Presupuestos
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Ingreso mensual y utilidades
  setMonthlyIncome: (amount: number) => Promise<void>;
  getRemainingBudget: (categoryId: string) => number;
  getTotalExpenses: () => number;
  getTotalIncome: () => number;
  getBalance: () => number;

  cards: Card[];
  addCard: (card: Omit<Card, 'id'>) => Promise<void>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  getInstallmentSummary: (year: number, month: number, cardId?: string | 'all') => {
    cash: number;
    installments: number;
    cashItems: Expense[];
    installmentItems: (Expense & { currentInstallment: number })[];
  };
  getMonthlyProjection: (months?: number, cardId?: string | 'all') => {
    label: string; year: number; month: number;
    total: number; cash: number; installments: number;
  }[];
};