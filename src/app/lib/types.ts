export type Expense = {
    id: string;
    description: string;
    amount: number;
    date: string;
    category?: string;
  };
  
  export type Income = {
    id: string;
    amount: number;
    name: string;
    type: 'monthly' | 'sales' | 'other';
    date: string;
  };

  export type IncomeType = {
    id: string;
    name: string;
    amount: number;
    type: 'monthly' | 'sales' | 'other';
    date: string;
  };
  
  export type BudgetCategory = {
    id: string;
    category: string;
    amount: number;
    spent: number;
  };
  
  export type ExpenseType = {
    id: string;
    category: string;
    amount: number;
    description: string;
    date: string;
  };

// types.ts
export type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
};

export type BudgetInput = Omit<Budget, 'id'>; // Tipo para creación
  
  export type FinanceContextType = {
    incomes: IncomeType[];
    addIncome: (income: IncomeType) => void;
    updateIncome: (id: string, income: IncomeType) => void;
    deleteIncome: (id: string) => void;
    budgets: BudgetCategory[];
    setBudgets: (budgets: BudgetCategory[]) => void;
    expenses: ExpenseType[];
    addExpense: (expense: ExpenseType) => void;
    deleteExpense: (id: string) => void;
  };